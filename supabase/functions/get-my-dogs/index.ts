// Edge Function for retrieving "my dogs" list from hundeweb.dk
// Uses stored session cookies and optionally saves to my_dogs table
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface SessionRecord {
  session_id: string;
  cookies: string;
  expires_at: string;
  is_active: boolean;
  login_method: 'CAS' | 'STANDARD';
}

interface DogBasicInfo {
  id: string;
  navn?: string;
  kallenavn?: string;
  rase?: string;
  kjoenn?: string;
  foedt?: string;
  [key: string]: any;
}

interface MyDogsResponse {
  success: boolean;
  dogsCount: number;
  dogs: DogBasicInfo[];
  sessionInfo?: {
    sessionId: string;
    expiresAt: string;
    loginMethod: string;
  };
  syncStats?: {
    newDogsCreated: number;
    existingDogsUpdated: number;
    errors: string[];
  };
  error?: string;
}

class MyDogsRetriever {
  private supabase: any;
  private mineHunderUrl: string;
  private supabaseUrl: string;
  private supabaseServiceKey: string;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.supabaseUrl = supabaseUrl;
    this.supabaseServiceKey = supabaseServiceKey;
    this.mineHunderUrl = "https://www.hundeweb.dk/dkk-hundedatabase-backend/rest/mineHunder";
  }

  async getValidSession(sessionId?: string): Promise<SessionRecord | null> {
    try {
      let query = this.supabase
        .from('scraper_sessions')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (sessionId) {
        // Use specific session if provided
        query = query.eq('session_id', sessionId);
      } else {
        // Get most recent valid session
        query = query.order('created_at', { ascending: false }).limit(1);
      }

      const { data: session, error } = await query.single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error("Error retrieving session:", error);
        return null;
      }

      if (!session) {
        console.log("No valid session found");
        return null;
      }

      console.log(`Using session: ${session.session_id}, expires: ${session.expires_at}, method: ${session.login_method}`);
      return session;

    } catch (error) {
      console.error("Error checking sessions:", error);
      return null;
    }
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.supabase
      .from('scraper_sessions')
      .update({ is_active: false })
      .eq('session_id', sessionId);
  }

  async fetchMyDogs(session: SessionRecord): Promise<DogBasicInfo[]> {
    console.log(`Fetching dog list from mineHunder endpoint with session ID: ${session.session_id}`);
    
    const response = await fetch(this.mineHunderUrl, {
      method: "GET",
      headers: {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Microsoft Edge\";v=\"139\", \"Chromium\";v=\"139\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0",
        "Cookie": session.cookies,
        "Referer": "https://www.hundeweb.dk/hundedatabase/hund"
      },
      mode: "cors",
      credentials: "include"
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`Error ${response.status} ${response.statusText}:`, "Response body:", responseText.substring(0, 500));

      if (responseText.includes('redirectUrl') && responseText.includes('cas/login')) {
        await this.invalidateSession(session.session_id);
        throw new Error(`Session expired. Redirect to login page detected.`);
      }

      // Check if it's an authentication issue
      if (response.status === 401 || response.status === 403) {
        
        throw new Error(`Authentication failed (${response.status}). Session may be expired.`);
      }

      throw new Error(`Failed to fetch dog list: ${response.status} ${response.statusText}`);
    }

    const dogs: DogBasicInfo[] = await response.json();

    console.log(`Successfully fetched ${dogs.length} dogs. ${JSON.stringify(dogs, null, 2)}`);

    return dogs;
  }

  async saveDogsToMyDogsTable(dogs: DogBasicInfo[]): Promise<{newDogsCreated: number, existingDogsUpdated: number, errors: string[]}> {
    const stats: {newDogsCreated: number, existingDogsUpdated: number, errors: string[]} = {
      newDogsCreated: 0,
      existingDogsUpdated: 0,
      errors: []
    };

    console.log(`Saving ${dogs.length} dogs to my_dogs table...`);

    for (const dog of dogs) {
      try {
        // Check if this dog already exists in my_dogs table
        const { data: existingMyDog, error: checkError } = await this.supabase
          .from('my_dogs')
          .select('id, is_active')
          .eq('dog_id', dog.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // Real error, not just "not found"
          stats.errors.push(`Error checking my_dogs for ${dog.id}: ${checkError.message}`);
          continue;
        }

        if (existingMyDog) {
          // Dog already exists, update without changing is_active
          const { error: updateError } = await this.supabase
            .from('my_dogs')
            .update({ 
              notes: `Updated from hundeweb.dk sync on ${new Date().toISOString().split('T')[0]}`,
              updated_at: new Date().toISOString()
            })
            .eq('dog_id', dog.id);

          if (updateError) {
            stats.errors.push(`Error updating ${dog.id}: ${updateError.message}`);
          } else {
            stats.existingDogsUpdated++;
          }
        } else {
          // Create new my_dogs record with is_active = false
          const myDogRecord = {
            dog_id: dog.id,
            acquisition_date: null,
            notes: `Added from hundeweb.dk sync on ${new Date().toISOString().split('T')[0]}`,
            is_active: false // New dogs default to inactive as requested
          };

          const { error: insertError } = await this.supabase
            .from('my_dogs')
            .insert(myDogRecord);

          if (insertError) {
            stats.errors.push(`Error creating my_dogs record for ${dog.id}: ${insertError.message}`);
          } else {
            stats.newDogsCreated++;
            console.log(`Created new my_dogs record for: ${dog.id} - ${dog.navn} (is_active: false)`);
          }
        }
      } catch (error) {
        stats.errors.push(`Unexpected error processing ${dog.id}: ${error.message}`);
        console.error(`Error processing dog ${dog.id}:`, error);
      }
    }

    console.log(`My dogs sync completed: ${stats.newDogsCreated} created, ${stats.existingDogsUpdated} updated, ${stats.errors.length} errors`);
    return stats;
  }

  async retrieveMyDogs(sessionId?: string, saveToDatabase: boolean = true): Promise<MyDogsResponse> {
    try {
      console.log(`Starting my dogs retrieval. [Save to database: ${saveToDatabase}] `);
      
      // Get valid session
      const session = await this.getValidSession(sessionId);
      
      if (!session) {
        return {
          success: false,
          dogsCount: 0,
          dogs: [],
          error: sessionId 
            ? `Session ${sessionId} not found or expired. Please create a new session.`
            : "No valid session available. Please create a session first."
        };
      }

      // Fetch the dogs
      const dogs = await this.fetchMyDogs(session);

      // Save to database if requested
      let syncStats: {newDogsCreated: number, existingDogsUpdated: number, errors: string[]} | undefined = undefined;
      if (saveToDatabase) {
        syncStats = await this.saveDogsToMyDogsTable(dogs);
      } else {
        console.log("Skipping database save (saveToDatabase = false)");
      }

      const result: MyDogsResponse = {
        success: true,
        dogsCount: dogs.length,
        dogs: dogs,
        sessionInfo: {
          sessionId: session.session_id,
          expiresAt: session.expires_at,
          loginMethod: session.login_method
        },
        syncStats: syncStats
      };

      console.log(`Operation completed. Success: ${result.success}, Dogs found: ${result.dogsCount}`);
      
      return result;

    } catch (error) {
      console.error("My dogs retrieval error:", error);
      return {
        success: false,
        dogsCount: 0,
        dogs: [],
        error: `Error: ${error.message}`
      };
    }
  }
}

serve(async (req) => {
  // Enable CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get Supabase credentials from environment
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        error: 'Server configuration error: Missing Supabase credentials',
        success: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get optional session ID and save flag from query params
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId') || undefined;
    const saveToDb = url.searchParams.get('save') !== 'false'; // Default to true

    console.log(`Processing request with session ID: ${sessionId || 'auto-select most recent'}, save to DB: ${saveToDb}`);

    // Create retriever and fetch dogs
    const retriever = new MyDogsRetriever(supabaseUrl, supabaseServiceKey);
    const result = await retriever.retrieveMyDogs(sessionId, saveToDb);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
