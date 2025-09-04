// Edge Function for retrieving "my dogs" list from hundeweb.dk
// Uses stored session cookies and only fetches the dog list
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
  error?: string;
}

class MyDogsRetriever {
  private supabase: any;
  private mineHunderUrl: string;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
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

  async fetchMyDogs(session: SessionRecord): Promise<MyDogsResponse> {
    try {
      console.log("Fetching dog list from mineHunder endpoint...");
      console.log(`Using cookies from session: ${session.session_id}`);
      
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

      console.log(`API response status: ${response.status}`);

      if (!response.ok) {
        console.error(`Dog list fetch failed: ${response.status} ${response.statusText}`);
        const responseText = await response.text();
        console.error("Response body:", responseText.substring(0, 500));

        // Check if it's an authentication issue
        if (response.status === 401 || response.status === 403) {
          return {
            success: false,
            dogsCount: 0,
            dogs: [],
            error: `Authentication failed (${response.status}). Session may be expired.`
          };
        }

        return {
          success: false,
          dogsCount: 0,
          dogs: [],
          error: `Failed to fetch dog list: ${response.status} ${response.statusText}`
        };
      }

      const dogs: DogBasicInfo[] = await response.json();
      
      console.log(`Successfully fetched ${dogs.length} dogs`);
      console.log("Dogs list:");
      dogs.forEach((dog, index) => {
        console.log(`${index + 1}. ID: ${dog.id}`);
        console.log(`   Name: ${dog.navn || 'N/A'}`);
        console.log(`   Nickname: ${dog.kallenavn || 'N/A'}`);
        console.log(`   Breed: ${dog.rase || 'N/A'}`);
        console.log(`   Gender: ${dog.kjoenn || 'N/A'}`);
        console.log(`   Born: ${dog.foedt || 'N/A'}`);
        console.log(`   Full data:`, JSON.stringify(dog, null, 2));
        console.log('---');
      });

      return {
        success: true,
        dogsCount: dogs.length,
        dogs: dogs,
        sessionInfo: {
          sessionId: session.session_id,
          expiresAt: session.expires_at,
          loginMethod: session.login_method
        }
      };

    } catch (error) {
      console.error("Error fetching dog list:", error);
      return {
        success: false,
        dogsCount: 0,
        dogs: [],
        error: `Network error: ${error.message}`
      };
    }
  }

  async updateSessionLastUsed(sessionId: string): Promise<void> {
    try {
      // Optional: Track when the session was last used
      // This assumes you have a last_used_at column, if not this will just log an error
      const { error } = await this.supabase
        .from('scraper_sessions')
        .update({ last_used_at: new Date().toISOString() })
        .eq('session_id', sessionId);

      if (error && !error.message.includes('column "last_used_at" does not exist')) {
        console.error("Error updating session last used:", error);
      }
    } catch (error) {
      // Silently ignore - this is just for tracking
      console.log("Note: Could not update session last_used_at (column may not exist)");
    }
  }

  async retrieveMyDogs(sessionId?: string): Promise<MyDogsResponse> {
    try {
      console.log("Starting my dogs retrieval...");
      
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

      // Update session usage tracking
      await this.updateSessionLastUsed(session.session_id);

      // Fetch the dogs
      const result = await this.fetchMyDogs(session);

      console.log(`Operation completed. Success: ${result.success}, Dogs found: ${result.dogsCount}`);
      
      return result;

    } catch (error) {
      console.error("My dogs retrieval error:", error);
      return {
        success: false,
        dogsCount: 0,
        dogs: [],
        error: `Unexpected error: ${error.message}`
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

    // Get optional session ID from query params
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId') || undefined;

    console.log(`Processing request with session ID: ${sessionId || 'auto-select most recent'}`);

    // Create retriever and fetch dogs
    const retriever = new MyDogsRetriever(supabaseUrl, supabaseServiceKey);
    const result = await retriever.retrieveMyDogs(sessionId);

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
