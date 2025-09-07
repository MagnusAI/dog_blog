// Edge Function for syncing specific dogs from my_dogs table with DKK database
// Uses stored session cookies and syncs dog details + basic pedigree relationships + breeder information
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

interface DbDog {
  id: string;
  name: string;
  nickname?: string;
  gender: 'M' | 'F';
  breed_id: number;
  birth_date?: string;
  death_date?: string;
  is_deceased: boolean;
  color?: string;
  owner_person_id?: string;
  original_dog_id?: string;
  breeder_id?: string;
}

interface DbBreed {
  id?: number;
  name: string;
  fci_number?: string;
  club_id?: string;
  club_name?: string;
}

interface DbPerson {
  id: string;
  name: string;
  type?: string;
  notes?: string;
  is_active?: boolean;
}

interface DbPedigreeRelationship {
  id?: number;
  dog_id: string;
  parent_id: string;
  relationship_type: 'SIRE' | 'DAM';
  generation: number;
  path: string;
}

interface SyncStats {
  breedsProcessed: number;
  breedsCreated: number;
  breedsUpdated: number;
  dogsProcessed: number;
  dogsCreated: number;
  dogsUpdated: number;
  pedigreeProcessed: number;
  pedigreeCreated: number;
  personsProcessed: number;
  personsCreated: number;
  personsUpdated: number;
  breedersProcessed: number;
  breedersNotFound: number;
  errors: string[];
  dogNotFoundCount: number;
  dogAccessDeniedCount: number;
}

interface SyncResult {
  success: boolean;
  processedDogsCount: number;
  skippedDogIds: string[];
  syncStats: SyncStats;
  error?: string;
}

class MyDogsSyncer {
  private supabase: any;
  private dogDetailsUrl: string;
  private breederUrl: string;
  private stats: SyncStats;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.dogDetailsUrl = "https://www.hundeweb.dk/dkk-hundedatabase-backend/rest/hund";
    this.breederUrl = "https://www.hundeweb.dk/dkk-hundedatabase-backend/rest/hund/kullOppdretter";
    this.stats = {
      breedsProcessed: 0,
      breedsCreated: 0,
      breedsUpdated: 0,
      dogsProcessed: 0,
      dogsCreated: 0,
      dogsUpdated: 0,
      pedigreeProcessed: 0,
      pedigreeCreated: 0,
      personsProcessed: 0,
      personsCreated: 0,
      personsUpdated: 0,
      breedersProcessed: 0,
      breedersNotFound: 0,
      errors: [],
      dogNotFoundCount: 0,
      dogAccessDeniedCount: 0
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

  async invalidateSession(sessionId: string): Promise<void> {
    await this.supabase
      .from('scraper_sessions')
      .update({ is_active: false })
      .eq('session_id', sessionId);
  }

  async fetchDogDetails(dogId: string, session: SessionRecord): Promise<any> {
    const url = `${this.dogDetailsUrl}?id=${encodeURIComponent(dogId)}`;
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
      const responseText = await response.text();
      console.error(`Error ${response.status} ${response.statusText}:`, responseText.substring(0, 500));

      if (responseText.includes('redirectUrl') && responseText.includes('cas/login')) {
        await this.invalidateSession(session.session_id);
        throw new Error(`Session expired. Redirect to login page detected.`);
      }

      if (response.status === 404) {
        this.stats.dogNotFoundCount++;
        return { error: 'DOG_NOT_FOUND', status: 404 };
      }
      
      if (response.status === 403 || response.status === 401) {
        this.stats.dogAccessDeniedCount++;
        return { error: 'ACCESS_DENIED', status: response.status };
      }

      throw new Error(`Failed to fetch dog details: ${response.status} ${response.statusText}`);
    }

    const details = await response.json();
    console.log(`Successfully fetched details for dog: ${dogId}`);
    return details;
  }

  async fetchBreederInfo(kullId: string, session: SessionRecord): Promise<any> {
    const url = `${this.breederUrl}?kullId=${encodeURIComponent(kullId)}`;
    console.log(`Fetching breeder info for kullId: ${kullId}`);
    
    try {
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
        const responseText = await response.text();
        console.error(`Error ${response.status} ${response.statusText}:`, responseText.substring(0, 500));

        if (responseText.includes('redirectUrl') && responseText.includes('cas/login')) {
          await this.invalidateSession(session.session_id);
          throw new Error(`Session expired. Redirect to login page detected.`);
        }

        if (response.status === 404) {
          this.stats.breedersNotFound++;
          console.log(`Breeder info not found for kullId: ${kullId}`);
          return { error: 'BREEDER_NOT_FOUND', status: 404 };
        }
        
        if (response.status === 403 || response.status === 401) {
          console.log(`Access denied for breeder info kullId: ${kullId}`);
          return { error: 'ACCESS_DENIED', status: response.status };
        }

        throw new Error(`Failed to fetch breeder info: ${response.status} ${response.statusText}`);
      }

      const breederInfo = await response.json();
      console.log(`Successfully fetched breeder info for kullId: ${kullId}`);
      return breederInfo;

    } catch (error) {
      console.error(`Error fetching breeder info for kullId ${kullId}:`, error);
      this.stats.errors.push(`Breeder fetch error for kullId ${kullId}: ${error.message}`);
      return { error: 'FETCH_ERROR', details: error.message };
    }
  }

  private mapDogData(dogDetails: any): DbDog {
    return {
      id: dogDetails.hundId,
      name: dogDetails.navn,
      nickname: dogDetails.kallenavn || undefined,
      gender: dogDetails.kjoenn === 'H' ? 'M' : 'F',
      breed_id: 0, // Will be set after breed sync
      birth_date: dogDetails.foedt || undefined,
      death_date: dogDetails.doedDato || undefined,
      is_deceased: dogDetails.doed || false,
      color: dogDetails.farge || undefined,
      owner_person_id: dogDetails.personIdHovedeier || undefined,
      original_dog_id: dogDetails.opprinneligHundId || undefined,
      breeder_id: undefined // Will be set after breeder sync
    };
  }

  private mapBreedData(breedDetails: any): DbBreed {
    return {
      name: breedDetails.navn,
      fci_number: breedDetails.fciNr || undefined,
      club_id: breedDetails.klubbId || undefined,
      club_name: breedDetails.klubbNavn || undefined
    };
  }

  private mapPersonData(breederInfo: any): DbPerson {
    // Create a notes string with all the additional information
    const notesArray: string[] = [];
    if (breederInfo.webUrl) notesArray.push(`Website: ${breederInfo.webUrl}`);
    if (breederInfo.utdannelse) notesArray.push('Has breeding education');
    if (breederInfo.masterclass) notesArray.push('Has masterclass certification');

    return {
      id: breederInfo.id,
      name: breederInfo.navn,
      type: 'breeder',
      notes: notesArray.length > 0 ? notesArray.join('\n') : undefined,
      is_active: true
    };
  }

  async syncBreed(breedDetails: any): Promise<number> {
    try {
      this.stats.breedsProcessed++;
      const breedData = this.mapBreedData(breedDetails);
      
      const { data: existingBreed, error: findError } = await this.supabase
        .from('breeds')
        .select('id')
        .eq('name', breedData.name)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      if (existingBreed) {
        const { error: updateError } = await this.supabase
          .from('breeds')
          .update(breedData)
          .eq('id', existingBreed.id);

        if (updateError) throw updateError;
        this.stats.breedsUpdated++;
        return existingBreed.id;
      } else {
        const { data: newBreed, error: insertError } = await this.supabase
          .from('breeds')
          .insert(breedData)
          .select('id')
          .single();

        if (insertError) throw insertError;
        this.stats.breedsCreated++;
        return newBreed.id;
      }
    } catch (error) {
      this.stats.errors.push(`Breed sync error for ${breedDetails.navn}: ${error.message}`);
      throw error;
    }
  }

  async syncPerson(breederInfo: any): Promise<void> {
    try {
      this.stats.personsProcessed++;
      const personData = this.mapPersonData(breederInfo);

      const { data: existingPerson, error: findError } = await this.supabase
        .from('persons')
        .select('id')
        .eq('id', personData.id)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      if (existingPerson) {
        const { error: updateError } = await this.supabase
          .from('persons')
          .update(personData)
          .eq('id', personData.id);

        if (updateError) throw updateError;
        this.stats.personsUpdated++;
        console.log(`Updated person: ${personData.id} - ${personData.name}`);
      } else {
        const { error: insertError } = await this.supabase
          .from('persons')
          .insert(personData);

        if (insertError) throw insertError;
        this.stats.personsCreated++;
        console.log(`Created person: ${personData.id} - ${personData.name}`);
      }
    } catch (error) {
      this.stats.errors.push(`Person sync error for ${breederInfo.id}: ${error.message}`);
      throw error;
    }
  }

  async syncDog(dogDetails: any, breedId: number, breederId?: string): Promise<void> {
    try {
      this.stats.dogsProcessed++;
      const dogData = this.mapDogData(dogDetails);
      dogData.breed_id = breedId;
      dogData.breeder_id = breederId;

      const { data: existingDog, error: findError } = await this.supabase
        .from('dogs')
        .select('id')
        .eq('id', dogData.id)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      if (existingDog) {
        const { error: updateError } = await this.supabase
          .from('dogs')
          .update(dogData)
          .eq('id', dogData.id);

        if (updateError) throw updateError;
        this.stats.dogsUpdated++;
      } else {
        const { error: insertError } = await this.supabase
          .from('dogs')
          .insert(dogData);

        if (insertError) throw insertError;
        this.stats.dogsCreated++;
      }
    } catch (error) {
      this.stats.errors.push(`Dog sync error for ${dogDetails.hundId}: ${error.message}`);
      throw error;
    }
  }

  async syncBasicPedigree(dogDetails: any): Promise<void> {
    try {
      const dogId = dogDetails.hundId;
      const relationships: DbPedigreeRelationship[] = [];

      if (dogDetails.farHundId) {
        relationships.push({
          dog_id: dogId,
          parent_id: dogDetails.farHundId,
          relationship_type: 'SIRE',
          generation: 1,
          path: '0'  // SIRE at generation 1 = path "0"
        });
      }

      if (dogDetails.morHundId) {
        relationships.push({
          dog_id: dogId,
          parent_id: dogDetails.morHundId,
          relationship_type: 'DAM',
          generation: 1,
          path: '1'  // DAM at generation 1 = path "1"
        });
      }

      if (relationships.length === 0) return;

      // Delete existing direct parent relationships for this dog
      await this.supabase
        .from('pedigree_relationships')
        .delete()
        .eq('dog_id', dogId)
        .eq('generation', 1);

      // Insert new relationships
      for (const relationship of relationships) {
        this.stats.pedigreeProcessed++;

        // Check if relationship already exists first, then insert or skip
        const { data: existingRelationship, error: checkError } = await this.supabase
          .from('pedigree_relationships')
          .select('id')
          .eq('dog_id', relationship.dog_id)
          .eq('parent_id', relationship.parent_id)
          .eq('relationship_type', relationship.relationship_type)
          .eq('generation', relationship.generation)
          .eq('path', relationship.path)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          this.stats.errors.push(`Pedigree check error for ${dogId} (${relationship.relationship_type}): ${checkError.message}`);
          continue;
        }

        if (!existingRelationship) {
          const { error: insertError } = await this.supabase
            .from('pedigree_relationships')
            .insert(relationship);

          if (insertError) {
            this.stats.errors.push(`Pedigree sync error for ${dogId} (${relationship.relationship_type}): ${insertError.message}`);
          } else {
            this.stats.pedigreeCreated++;
            console.log(`Created pedigree relationship: ${dogId} -> ${relationship.parent_id} (${relationship.relationship_type}, path: ${relationship.path})`);
          }
        } else {
          console.log(`Pedigree relationship already exists, skipping: ${dogId} -> ${relationship.parent_id} (${relationship.relationship_type})`);
        }
      }
    } catch (error) {
      this.stats.errors.push(`Pedigree sync error for ${dogDetails.hundId}: ${error.message}`);
      console.error('Pedigree sync error:', error);
    }
  }

  async syncMyDogs(sessionId?: string, limit?: number): Promise<SyncResult> {
    try {
      console.log(`Starting my dogs sync. Limit: ${limit || 'None'}`);
      
      // Get valid session
      const session = await this.getValidSession(sessionId);
      
      if (!session) {
        return {
          success: false,
          processedDogsCount: 0,
          skippedDogIds: [],
          syncStats: this.stats,
          error: sessionId 
            ? `Session ${sessionId} not found or expired. Please create a new session.`
            : "No valid session available. Please create a session first."
        };
      }

      // Fetch dog IDs from my_dogs table
      let query = this.supabase
        .from('my_dogs')
        .select('dog_id')
        .order('created_at', { ascending: false });
      
      if (limit && limit > 0) {
        query = query.limit(limit);
      }
      
      const { data: myDogsData, error: fetchError } = await query;
      
      if (fetchError) {
        return {
          success: false,
          processedDogsCount: 0,
          skippedDogIds: [],
          syncStats: this.stats,
          error: `Failed to fetch dog IDs from database: ${fetchError.message}`
        };
      }
      
      if (!myDogsData || myDogsData.length === 0) {
        return {
          success: true,
          processedDogsCount: 0,
          skippedDogIds: [],
          syncStats: this.stats
        };
      }
      
      const dogIds = myDogsData.map(row => row.dog_id);
      console.log(`Found ${dogIds.length} dogs in my_dogs table`);
      
      // Process each dog
      const skippedDogIds: string[] = [];
      const processedBreeds = new Map<string, number>();

      for (const dogId of dogIds) {
        try {
          console.log(`Processing dog ID: ${dogId}`);
          
          const dogDetails = await this.fetchDogDetails(dogId, session);
          
          // Handle cases where dog doesn't exist or access is denied
          if (dogDetails.error) {
            console.log(`Dog ${dogId} ${dogDetails.error === 'DOG_NOT_FOUND' ? 'not found' : 'access denied'}, skipping...`);
            skippedDogIds.push(dogId);
            continue;
          }
          
          // Sync breed first
          let breedId: number;
          const breedName = dogDetails.rase?.navn;
          
          if (!breedName) {
            this.stats.errors.push(`Skipping dog ${dogId}: No breed information`);
            skippedDogIds.push(dogId);
            continue;
          }

          if (processedBreeds.has(breedName)) {
            breedId = processedBreeds.get(breedName)!;
          } else {
            breedId = await this.syncBreed(dogDetails.rase);
            processedBreeds.set(breedName, breedId);
          }

          // Sync breeder information if kullId is available
          let breederId: string | undefined = undefined;
          if (dogDetails.kullId) {
            this.stats.breedersProcessed++;
            console.log(`Processing breeder for kullId: ${dogDetails.kullId}`);
            
            // Add delay before breeder fetch to be respectful
            await new Promise((resolve) => setTimeout(resolve, 300));
            
            const breederInfo = await this.fetchBreederInfo(dogDetails.kullId, session);
            
            if (!breederInfo.error && breederInfo.hovedOppdretter) {
              try {
                await this.syncPerson(breederInfo.hovedOppdretter);
                breederId = breederInfo.hovedOppdretter.id;
                console.log(`Successfully synced breeder: ${breederId} - ${breederInfo.hovedOppdretter.navn}`);
              } catch (error) {
                console.error(`Failed to sync breeder for kullId ${dogDetails.kullId}:`, error);
                this.stats.errors.push(`Breeder sync error for kullId ${dogDetails.kullId}: ${error.message}`);
              }
            } else {
              console.log(`No breeder info found or error for kullId: ${dogDetails.kullId}`);
            }
          } else {
            console.log(`No kullId available for dog: ${dogId}`);
          }

          // Sync dog details
          await this.syncDog(dogDetails, breedId, breederId);

          // Sync basic pedigree (mother and father only)
          await this.syncBasicPedigree(dogDetails);

          console.log(`Successfully synced dog: ${dogId} - ${dogDetails.navn}${breederId ? ` (breeder: ${breederId})` : ''}`);
          
          // Add delay to be respectful to the server
          await new Promise((resolve) => setTimeout(resolve, 500));
          
        } catch (error) {
          this.stats.errors.push(`Failed to process dog ${dogId}: ${error.message}`);
          skippedDogIds.push(dogId);
          console.error(`Error processing dog ${dogId}:`, error);
        }
      }

      const processedCount = dogIds.length - skippedDogIds.length;
      console.log(`Sync completed. Processed: ${processedCount}, Skipped: ${skippedDogIds.length}`);
      
      return {
        success: true,
        processedDogsCount: processedCount,
        skippedDogIds: skippedDogIds,
        syncStats: this.stats
      };

    } catch (error) {
      console.error("My dogs sync error:", error);
      return {
        success: false,
        processedDogsCount: 0,
        skippedDogIds: [],
        syncStats: this.stats,
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

    // Get optional session ID and limit from query params
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId') || undefined;
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    console.log(`Processing request with session ID: ${sessionId || 'auto-select most recent'}, limit: ${limit || 'none'}`);

    // Create syncer and process dogs
    const syncer = new MyDogsSyncer(supabaseUrl, supabaseServiceKey);
    const result = await syncer.syncMyDogs(sessionId, limit);

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