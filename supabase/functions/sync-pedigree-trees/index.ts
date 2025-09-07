// Edge Function for fetching pedigree information for dogs in my_dogs table
// Uses stored session cookies and updates pedigree_relationships table
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

interface PedigreeHund {
    sti: string;
    hundId: string;
    navn: string;
    tittel: string;
    farge: string | null;
    hd: string | null;
    ad: string | null;
    ocd: string | null;
    ryg: string | null;
    udlRyg: string | null;
    patella: string | null;
}

interface PedigreeTreeResponse {
    antallGenerasjonerInnavlsberegning: number;
    antallGenerasjonerStamtavle: number;
    innavlKoeffisient: number;
    hunder: PedigreeHund[];
    unikeInnavlshunder: any[];
    dato: string;
    hunderMorSide: PedigreeHund[];
    hunderFarSide: PedigreeHund[];
    innavlKoeffisientProsent: number;
}

interface DogWithParents {
    id: string;
    name: string;
    sire_id?: string;
    dam_id?: string;
}

interface PedigreeStats {
    dogsProcessed: number;
    pedigreeTreesFetched: number;
    ancestorsCreated: number;
    relationshipsCreated: number;
    titlesCreated: number;
    errors: string[];
}

interface PedigreeResponse {
    success: boolean;
    message: string;
    stats: PedigreeStats;
    sessionInfo?: {
        sessionId: string;
        expiresAt: string;
        loginMethod: string;
    };
    error?: string;
}

class PedigreeFetcher {
    private supabase: any;
    private pedigreeUrl: string;
    private stats: PedigreeStats;

    constructor(supabaseUrl: string, supabaseServiceKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseServiceKey);
        this.pedigreeUrl = "https://www.hundeweb.dk/dkk-hundedatabase-backend/rest/hund/stamtavleTre";
        this.stats = {
            dogsProcessed: 0,
            pedigreeTreesFetched: 0,
            ancestorsCreated: 0,
            relationshipsCreated: 0,
            titlesCreated: 0,
            errors: []
        };
    }

    async invalidateSession(sessionId: string): Promise<void> {
        await this.supabase
            .from('scraper_sessions')
            .update({ is_active: false })
            .eq('session_id', sessionId);
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

    async getMyDogsWithParents(): Promise<DogWithParents[]> {
        try {
            // First get active dogs with basic info
            const { data: myDogsData, error } = await this.supabase
                .from('my_dogs')
                .select(`
          dog_id,
          dogs!fk_my_dogs_dog (
            id,
            name
          )
        `)
                .eq('is_active', true);

            if (error) {
                console.error("Error fetching my dogs:", error);
                return [];
            }

            if (!myDogsData || myDogsData.length === 0) {
                return [];
            }

            // Get all dog IDs for batch query
            const dogIds = myDogsData
                .filter(myDog => myDog.dogs)
                .map(myDog => myDog.dog_id);

            if (dogIds.length === 0) {
                return [];
            }

            // Get all parent relationships for these dogs in one query
            const { data: allParents, error: parentError } = await this.supabase
                .from('pedigree_relationships')
                .select('dog_id, parent_id, relationship_type')
                .in('dog_id', dogIds)
                .eq('generation', 1)
                .in('relationship_type', ['SIRE', 'DAM']);

            if (parentError) {
                console.error("Error fetching parent relationships:", parentError);
                return [];
            }

            // Create a map for quick lookups
            const parentMap = new Map<string, { sire_id?: string, dam_id?: string }>();

            allParents?.forEach(parent => {
                if (!parentMap.has(parent.dog_id)) {
                    parentMap.set(parent.dog_id, {});
                }

                const dogParents = parentMap.get(parent.dog_id)!;
                if (parent.relationship_type === 'SIRE') {
                    dogParents.sire_id = parent.parent_id;
                } else if (parent.relationship_type === 'DAM') {
                    dogParents.dam_id = parent.parent_id;
                }
            });

            // Build result array
            const dogsWithParents: DogWithParents[] = myDogsData
                .filter(myDog => myDog.dogs)
                .map(myDog => {
                    const parents = parentMap.get(myDog.dog_id) || {};
                    return {
                        id: myDog.dogs.id,
                        name: myDog.dogs.name,
                        sire_id: parents.sire_id,
                        dam_id: parents.dam_id
                    };
                });

            // Only return dogs that have both parents
            const dogsWithBothParents = dogsWithParents.filter(dog =>
                dog.sire_id && dog.dam_id
            );

            console.log(`Found ${dogsWithBothParents.length} active dogs with both parents`);
            return dogsWithBothParents;

        } catch (error) {
            console.error("Error getting my dogs with parents:", error);
            return [];
        }
    }

    async fetchPedigreeTree(session: SessionRecord, sireId?: string, damId?: string, generations: number = 4): Promise<PedigreeTreeResponse | null> {
        try {
            if (!sireId && !damId) {
                console.log("No parent IDs provided for pedigree tree");
                return null;
            }

            const params = new URLSearchParams({
                antallGenerasjonerInnavlsberegning: '3',
                antallGenerasjonerStamtavle: generations.toString(),
                fiktiv: 'false'
            });

            if (sireId) params.append('farHundId', sireId);
            if (damId) params.append('morHundId', damId);

            const url = `${this.pedigreeUrl}?${params.toString()}`;
            console.log(`Fetching pedigree tree for sire: ${sireId || 'N/A'}, dam: ${damId || 'N/A'}`);

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

                throw new Error(`Failed to fetch pedigree tree: ${response.status} ${response.statusText}`);
            }

            const pedigreeData: PedigreeTreeResponse = await response.json();
            console.log(`Successfully fetched pedigree tree with ${pedigreeData.hunder?.length || 0} dogs`);
            return pedigreeData;

        } catch (error) {
            console.error("Error fetching pedigree tree:", error);
            return null;
        }
    }

    // Parse concatenated title strings into individual titles
    private parseTitles(dogId: string, titleString: string) {
        if (!titleString || titleString.trim() === '') return [];

        const titles = titleString.trim().split(/\s+/);

        return titles.map(titleCode => ({
            dog_id: dogId,
            title_code: titleCode,
            title_full_name: this.expandTitleCode(titleCode),
            country_code: this.extractCountryFromTitle(titleCode),
            year_earned: undefined
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

   // Helper method to determine relationship type from sti path
   private determineRelationshipFromSti(sti: string): { relationshipType: 'SIRE' | 'DAM', generation: number } {
    const generation = sti.length;
    
    if (generation === 0) {
        throw new Error("Cannot determine relationship for empty sti (child itself)");
    }
    
    // The relationship type is determined by the last character in the path
    // 0 = father/sire, 1 = mother/dam
    const lastChar = sti[sti.length - 1];
    const relationshipType: 'SIRE' | 'DAM' = lastChar === '0' ? 'SIRE' : 'DAM';
    
    return { relationshipType, generation };
}

// Helper method to determine gender from sti path
private determineGenderFromSti(sti: string): 'M' | 'F' {
    if (sti.length === 0) {
        return 'M'; // Default for child
    }
    
    // Gender is determined by the last character in the path
    // 0 = male (father), 1 = female (mother)
    const lastChar = sti[sti.length - 1];
    return lastChar === '0' ? 'M' : 'F';
}

async createAncestorDog(pedigreeHund: PedigreeHund): Promise<void> {
    try {
        // Check if dog already exists
        const { data: existingDog, error: checkError } = await this.supabase
            .from('dogs')
            .select('id')
            .eq('id', pedigreeHund.hundId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        if (existingDog) {
            console.log(`Dog ${pedigreeHund.hundId} already exists, skipping creation`);
            return;
        }

        // Determine gender from sti path
        const gender = this.determineGenderFromSti(pedigreeHund.sti);

        const ancestorDog = {
            id: pedigreeHund.hundId,
            name: pedigreeHund.navn,
            nickname: undefined,
            gender: gender,
            breed_id: 1, // Default breed - would need better logic to determine actual breed
            birth_date: undefined,
            death_date: undefined,
            is_deceased: false,
            color: pedigreeHund.farge || undefined,
            owner_person_id: undefined,
            original_dog_id: undefined
        };

        const { error: insertError } = await this.supabase
            .from('dogs')
            .insert(ancestorDog);

        if (insertError) {
            throw insertError;
        }

        this.stats.ancestorsCreated++;
        console.log(`Created ancestor dog: ${pedigreeHund.hundId} - ${pedigreeHund.navn} (${gender}, sti: ${pedigreeHund.sti})`);

        // Add titles if available
        if (pedigreeHund.tittel && pedigreeHund.tittel.trim()) {
            const titles = this.parseTitles(pedigreeHund.hundId, pedigreeHund.tittel);
            for (const title of titles) {
                // Check if title already exists
                const { data: existingTitle } = await this.supabase
                    .from('titles')
                    .select('id')
                    .eq('dog_id', title.dog_id)
                    .eq('title_code', title.title_code)
                    .single();

                if (!existingTitle) {
                    const { error: titleError } = await this.supabase
                        .from('titles')
                        .insert(title);

                    if (!titleError) {
                        this.stats.titlesCreated++;
                    }
                }
            }
            console.log(`Added ${titles.length} titles for ${pedigreeHund.hundId}`);
        }

    } catch (error) {
        this.stats.errors.push(`Error creating ancestor ${pedigreeHund.hundId}: ${error.message}`);
        console.error(`Error creating ancestor ${pedigreeHund.hundId}:`, error);
    }
}

async createPedigreeRelationship(childDogId: string, pedigreeHund: PedigreeHund): Promise<void> {
    try {
        if (pedigreeHund.sti.length === 0) {
            return; // Skip child itself
        }
        
        if (pedigreeHund.sti.length > 4) {
            return; // Limit to 4 generations
        }

        const { relationshipType, generation } = this.determineRelationshipFromSti(pedigreeHund.sti);

        const relationship = {
            dog_id: childDogId,
            parent_id: pedigreeHund.hundId,
            relationship_type: relationshipType,
            generation: generation,
            path: pedigreeHund.sti  // Store the sti value in the path column
        };

        console.log(`Creating relationship with path: "${pedigreeHund.sti}" for ${pedigreeHund.hundId}`);

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
            throw checkError;
        }

        if (!existingRelationship) {
            const { error } = await this.supabase
                .from('pedigree_relationships')
                .insert(relationship);

            if (error) {
                throw error;
            }
        } else {
            console.log(`Relationship already exists, skipping: ${relationship.dog_id} -> ${relationship.parent_id}`);
            return; // Don't increment the counter for skipped relationships
        }
        
        this.stats.relationshipsCreated++;
        console.log(`Created relationship: ${childDogId} -> ${pedigreeHund.hundId} (${relationshipType}, gen ${generation}, path: ${pedigreeHund.sti})`);

    } catch (error) {
        this.stats.errors.push(`Error creating relationship ${childDogId} -> ${pedigreeHund.hundId}: ${error.message}`);
        console.error(`Error creating relationship:`, error);
    }
}

    // Optional helper method to decode a path for debugging/display purposes
    private decodePath(sti: string): string {
        if (sti.length === 0) return "self";
        
        const pathSegments: string[] = [];
        
        for (let i = 0; i < sti.length; i++) {
            if (sti[i] === '0') {
                pathSegments.push('father');
            } else {
                pathSegments.push('mother');
            }
        }
        
        return pathSegments.join('_');
    }

    async processPedigreeTree(childDogId: string, pedigreeTree: PedigreeTreeResponse): Promise<void> {
        try {
            console.log(`Processing pedigree tree for ${childDogId} with ${pedigreeTree.hunder.length} ancestors`);

            // First, create all ancestor dogs
            for (const pedigreeHund of pedigreeTree.hunder) {
                if (pedigreeHund.sti === '') continue; // Skip the child dog itself
                await this.createAncestorDog(pedigreeHund);
            }

            // Then create pedigree relationships
            for (const pedigreeHund of pedigreeTree.hunder) {
                if (pedigreeHund.sti === '') continue; // Skip the child dog itself
                await this.createPedigreeRelationship(childDogId, pedigreeHund);
            }

            console.log(`Completed pedigree processing for ${childDogId}`);

        } catch (error) {
            this.stats.errors.push(`Error processing pedigree tree for ${childDogId}: ${error.message}`);
            console.error(`Error processing pedigree tree for ${childDogId}:`, error);
        }
    }

    async fetchPedigreeForMyDogs(sessionId?: string, generations: number = 4): Promise<PedigreeResponse> {
        try {
            console.log("Starting pedigree fetch for my dogs...");

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

            // Get dogs from my_dogs with parent information
            const myDogs = await this.getMyDogsWithParents();

            if (myDogs.length === 0) {
                return {
                    success: true,
                    message: "No active dogs found in my_dogs table with parent information",
                    stats: this.stats,
                    sessionInfo: {
                        sessionId: session.session_id,
                        expiresAt: session.expires_at,
                        loginMethod: session.login_method
                    }
                };
            }

            console.log(`Processing ${myDogs.length} dogs for pedigree information`);

            // Process each dog
            for (const dog of myDogs) {
                try {
                    this.stats.dogsProcessed++;
                    console.log(`Processing dog: ${dog.id} - ${dog.name}`);

                    if (!dog.sire_id && !dog.dam_id) {
                        console.log(`Skipping ${dog.id}: No parent information available`);
                        continue;
                    }

                    // Fetch pedigree tree
                    const pedigreeTree = await this.fetchPedigreeTree(session, dog.sire_id, dog.dam_id, generations);

                    if (!pedigreeTree) {
                        this.stats.errors.push(`Failed to fetch pedigree tree for ${dog.id}`);
                        continue;
                    }

                    this.stats.pedigreeTreesFetched++;

                    // Process the pedigree tree
                    await this.processPedigreeTree(dog.id, pedigreeTree);

                    // Add delay between requests to be polite to the server
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    this.stats.errors.push(`Error processing dog ${dog.id}: ${error.message}`);
                    console.error(`Error processing dog ${dog.id}:`, error);
                }
            }

            const message = `Processed ${this.stats.dogsProcessed} dogs. ` +
                `Fetched ${this.stats.pedigreeTreesFetched} pedigree trees. ` +
                `Created ${this.stats.ancestorsCreated} ancestors, ${this.stats.relationshipsCreated} relationships, ` +
                `and ${this.stats.titlesCreated} titles. ${this.stats.errors.length} errors.`;

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
            console.error("Pedigree fetch error:", error);
            return {
                success: false,
                message: "Unexpected error during pedigree fetch",
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
        const generations = parseInt(url.searchParams.get('generations') || '4');

        console.log(`Processing pedigree fetch with session: ${sessionId || 'auto-select'}, generations: ${generations}`);

        // Create fetcher and process pedigrees
        const fetcher = new PedigreeFetcher(supabaseUrl, supabaseServiceKey);
        const result = await fetcher.fetchPedigreeForMyDogs(sessionId, generations);

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