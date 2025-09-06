// Edge Function for fetching titles for all dogs in the dogs table
// Uses stored session cookies and updates titles table
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

interface DogRecord {
  id: string;
  name: string;
}

interface DogDetailsResponse {
  hundId: string;
  navn: string;
  tittel?: string;
  tittel1?: string;
  tittel2?: string;
  tittel3?: string;
}

interface DbTitle {
  id?: number;
  dog_id: string;
  title_code: string;
  title_full_name?: string;
  country_code?: string;
  year_earned?: number;
}

interface TitlesStats {
  dogsProcessed: number;
  dogsWithTitles: number;
  titlesCreated: number;
  titlesUpdated: number;
  dogsNotFound: number;
  dogsAccessDenied: number;
  errors: string[];
}

interface TitlesResponse {
  success: boolean;
  message: string;
  stats: TitlesStats;
  sessionInfo?: {
    sessionId: string;
    expiresAt: string;
    loginMethod: string;
  };
  error?: string;
}

class TitlesFetcher {
  private supabase: any;
  private dogDetailsBaseUrl: string;
  private stats: TitlesStats;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.dogDetailsBaseUrl = "https://www.hundeweb.dk/dkk-hundedatabase-backend/rest/hund";
    this.stats = {
      dogsProcessed: 0,
      dogsWithTitles: 0,
      titlesCreated: 0,
      titlesUpdated: 0,
      dogsNotFound: 0,
      dogsAccessDenied: 0,
      errors: []
    };
  }

  async getValidSession(sessionId?: string): Promise<SessionRecord | null> {
    try {
      let query = this.supabase
        .from('scraper_sessions')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else {
        query = query.order('created_at', { ascending: false }).limit(1);
      }

      const { data: session, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error retrieving session:", error);
        return null;
      }

      if (!session) {
        console.log("No valid session found");
        return null;
      }

      console.log(`Using session: ${session.session_id}, expires: ${session.expires_at}`);
      return session;

    } catch (error) {
      console.error("Error checking sessions:", error);
      return null;
    }
  }

  async getAllDogs(limit?: number): Promise<DogRecord[]> {
    try {
      let query = this.supabase
        .from('dogs')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (limit && limit > 0) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching dogs:", error);
        return [];
      }

      console.log(`Found ${data?.length || 0} dogs in database`);
      return data || [];

    } catch (error) {
      console.error("Error getting dogs:", error);
      return [];
    }
  }

  async fetchDogDetails(session: SessionRecord, dogId: string): Promise<DogDetailsResponse | null> {
    try {
      const url = `${this.dogDetailsBaseUrl}?id=${encodeURIComponent(dogId)}`;
      console.log(`Fetching details for dog: ${dogId}`);

      const response = await fetch(url, {
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
        if (response.status === 404) {
          console.log(`Dog ${dogId} not found in DKK database (404)`);
          this.stats.dogsNotFound++;
          return null;
        }
        if (response.status === 403 || response.status === 401) {
          console.log(`Access denied for dog ${dogId} (${response.status})`);
          this.stats.dogsAccessDenied++;
          return null;
        }

        console.error(`Dog details fetch failed for ${dogId}: ${response.status} ${response.statusText}`);
        this.stats.errors.push(`Failed to fetch ${dogId}: ${response.status} ${response.statusText}`);
        return null;
      }

      const details: DogDetailsResponse = await response.json();
      console.log(`Successfully fetched details for dog: ${dogId}`);
      return details;

    } catch (error) {
      console.error(`Error fetching details for dog ${dogId}:`, error);
      this.stats.errors.push(`Error fetching ${dogId}: ${error.message}`);
      return null;
    }
  }

  // Parse concatenated title strings into individual titles
  private parseTitles(dogId: string, titleString: string): DbTitle[] {
    if (!titleString || titleString.trim() === '') return [];
    
    const titles = titleString.trim().split(/\s+/);
    
    return titles.map(titleCode => ({
      dog_id: dogId,
      title_code: titleCode,
      title_full_name: this.expandTitleCode(titleCode),
      country_code: this.extractCountryFromTitle(titleCode),
      year_earned: undefined // We don't have year info in the scraped data
    }));
  }

  private expandTitleCode(titleCode: string): string | undefined {
    const titleMap: { [key: string]: string } = {
      'DKCH': 'Danish Champion',
      'SECH': 'Swedish Champion',
      'NOCH': 'Norwegian Champion',
      'FINCH': 'Finnish Champion',
      'FICH': 'Finnish Champion',
      'INTCH': 'International Champion',
      'DKJUCH': 'Danish Junior Champion',
      'KLBJCH': 'Club Junior Champion',
      'KLBCH': 'Club Champion',
      'WW': 'World Winner',
      'EW': 'European Winner',
      'NORDCH': 'Nordic Champion',
      'GBCH': 'Great Britain Champion',
      'CIB': 'International Beauty Champion',
      'DECH': 'German Champion',
      'DEVDHCH': 'German VDH Champion'
    };
    return titleMap[titleCode];
  }

  private extractCountryFromTitle(titleCode: string): string | undefined {
    if (titleCode.startsWith('DK')) return 'DK';
    if (titleCode.startsWith('SE')) return 'SE';
    if (titleCode.startsWith('NO')) return 'NO';
    if (titleCode.startsWith('FIN') || titleCode.startsWith('FI')) return 'FI';
    if (titleCode.startsWith('GB')) return 'GB';
    if (titleCode.startsWith('DE')) return 'DE';
    if (titleCode.includes('INT')) return 'INT';
    return 'DK'; // Default to Denmark
  }

  async syncTitlesForDog(dogId: string, dogDetails: DogDetailsResponse): Promise<void> {
    try {
      const allTitles: DbTitle[] = [];

      // Parse titles from different fields
      if (dogDetails.tittel1) {
        allTitles.push(...this.parseTitles(dogId, dogDetails.tittel1));
      }
      if (dogDetails.tittel2) {
        allTitles.push(...this.parseTitles(dogId, dogDetails.tittel2));
      }
      if (dogDetails.tittel3) {
        allTitles.push(...this.parseTitles(dogId, dogDetails.tittel3));
      }
      if (dogDetails.tittel) {
        allTitles.push(...this.parseTitles(dogId, dogDetails.tittel));
      }

      if (allTitles.length === 0) {
        console.log(`No titles found for dog ${dogId}`);
        return;
      }

      console.log(`Found ${allTitles.length} titles for dog ${dogId}`);
      this.stats.dogsWithTitles++;

      // Delete existing titles for this dog to avoid duplicates
      const { error: deleteError } = await this.supabase
        .from('titles')
        .delete()
        .eq('dog_id', dogId);

      if (deleteError) {
        this.stats.errors.push(`Error deleting existing titles for ${dogId}: ${deleteError.message}`);
        return;
      }

      // Insert new titles
      for (const title of allTitles) {
        const { error } = await this.supabase
          .from('titles')
          .insert(title);

        if (error) {
          this.stats.errors.push(`Title sync error for ${dogId} (${title.title_code}): ${error.message}`);
        } else {
          this.stats.titlesCreated++;
          console.log(`Created title: ${dogId} - ${title.title_code}`);
        }
      }

    } catch (error) {
      this.stats.errors.push(`Titles sync error for ${dogId}: ${error.message}`);
      console.error('Titles sync error:', error);
    }
  }

  async fetchTitlesForAllDogs(sessionId?: string, limit?: number): Promise<TitlesResponse> {
    try {
      console.log("Starting titles fetch for all dogs...");

      // Get valid session
      const session = await this.getValidSession(sessionId);
      if (!session) {
        return {
          success: false,
          message: "No valid session available",
          stats: this.stats,
          error: sessionId 
            ? `Session ${sessionId} not found or expired`
            : "No valid session available. Please create a session first."
        };
      }

      // Get all dogs from database
      const dogs = await this.getAllDogs(limit);
      
      if (dogs.length === 0) {
        return {
          success: true,
          message: "No dogs found in database",
          stats: this.stats,
          sessionInfo: {
            sessionId: session.session_id,
            expiresAt: session.expires_at,
            loginMethod: session.login_method
          }
        };
      }

      console.log(`Processing ${dogs.length} dogs for title information`);

      // Process each dog
      for (const dog of dogs) {
        try {
          this.stats.dogsProcessed++;
          console.log(`Processing dog: ${dog.id} - ${dog.name} (${this.stats.dogsProcessed}/${dogs.length})`);

          // Fetch detailed information
          const dogDetails = await this.fetchDogDetails(session, dog.id);
          
          if (!dogDetails) {
            console.log(`Skipping ${dog.id}: Could not fetch details`);
            continue;
          }

          // Sync titles for this dog
          await this.syncTitlesForDog(dog.id, dogDetails);

          // Add delay between requests to be polite to the server
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          this.stats.errors.push(`Error processing dog ${dog.id}: ${error.message}`);
          console.error(`Error processing dog ${dog.id}:`, error);
        }
      }

      const message = `Processed ${this.stats.dogsProcessed} dogs. ` +
        `Found titles for ${this.stats.dogsWithTitles} dogs. ` +
        `Created ${this.stats.titlesCreated} titles. ` +
        `${this.stats.dogsNotFound} dogs not found, ${this.stats.dogsAccessDenied} access denied. ` +
        `${this.stats.errors.length} errors.`;

      return {
        success: true,
        message: message,
        stats: this.stats,
        sessionInfo: {
          sessionId: session.session_id,
          expiresAt: session.expires_at,
          loginMethod: session.login_method
        }
      };

    } catch (error) {
      console.error("Titles fetch error:", error);
      return {
        success: false,
        message: "Unexpected error during titles fetch",
        stats: this.stats,
        error: error.message
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

    // Get optional parameters
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId') || undefined;
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    console.log(`Processing titles fetch with session: ${sessionId || 'auto-select'}, limit: ${limit || 'no limit'}`);

    // Create fetcher and process titles
    const fetcher = new TitlesFetcher(supabaseUrl, supabaseServiceKey);
    const result = await fetcher.fetchTitlesForAllDogs(sessionId, limit);

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