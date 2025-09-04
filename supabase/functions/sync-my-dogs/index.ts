// Edge Function for syncing specific dogs from my_dogs table with DKK database
// This function fetches dog IDs from the local my_dogs table and syncs their data
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Database types based on our schema
interface DbBreed {
  id?: number;
  name: string;
  fci_number?: string;
  club_id?: string;
  club_name?: string;
}

// Scraping result types
interface ScrapedDog {
  basicInfo: any;
  detailedInfo: any;
  pedigreeTree?: any;
}

interface SyncResult {
  success: boolean;
  processedDogsCount: number;
  dogs: ScrapedDog[];
  skippedDogIds: string[];
  error?: string;
  syncStats?: SyncStats | null;
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
}

interface DbTitle {
  id?: number;
  dog_id: string;
  title_code: string;
  title_full_name?: string;
  country_code?: string;
  year_earned?: number;
}

interface DbPedigreeRelationship {
  id?: number;
  dog_id: string;
  parent_id: string;
  relationship_type: 'SIRE' | 'DAM';
  generation: number;
}

interface SyncStats {
  breedsProcessed: number;
  breedsCreated: number;
  breedsUpdated: number;
  dogsProcessed: number;
  dogsCreated: number;
  dogsUpdated: number;
  placeholderDogsCreated: number;
  titlesProcessed: number;
  titlesCreated: number;
  pedigreeProcessed: number;
  pedigreeCreated: number;
  pedigreeSkipped: number;
  pedigreeTreesProcessed: number;
  pedigreeAncestorsCreated: number;
  errors: string[];
  dogNotFoundCount: number;
  dogAccessDeniedCount: number;
}

class DataSyncer {
  private supabase: any;
  private stats: SyncStats;
  private createPlaceholders: boolean;

  constructor(supabaseUrl: string, supabaseServiceKey: string, createPlaceholders: boolean = true) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.stats = {
      breedsProcessed: 0,
      breedsCreated: 0,
      breedsUpdated: 0,
      dogsProcessed: 0,
      dogsCreated: 0,
      dogsUpdated: 0,
      placeholderDogsCreated: 0,
      titlesProcessed: 0,
      titlesCreated: 0,
      pedigreeProcessed: 0,
      pedigreeCreated: 0,
      pedigreeSkipped: 0,
      pedigreeTreesProcessed: 0,
      pedigreeAncestorsCreated: 0,
      errors: [],
      dogNotFoundCount: 0,
      dogAccessDeniedCount: 0
    };
    this.createPlaceholders = createPlaceholders;
  }

  // Map Danish field names to English and convert data types
  private mapDogData(scrapedDog: any): DbDog {
    return {
      id: scrapedDog.detailedInfo.hundId,
      name: scrapedDog.detailedInfo.navn,
      nickname: scrapedDog.detailedInfo.kallenavn || undefined,
      gender: scrapedDog.detailedInfo.kjoenn === 'H' ? 'M' : 'F', // H=Han(Male) -> M, T=Tæve(Female) -> F
      breed_id: 0, // Will be set after breed sync
      birth_date: scrapedDog.detailedInfo.foedt || undefined,
      death_date: scrapedDog.detailedInfo.doedDato || undefined,
      is_deceased: scrapedDog.detailedInfo.doed || false,
      color: scrapedDog.detailedInfo.farge || undefined,
      owner_person_id: scrapedDog.detailedInfo.personIdHovedeier || undefined,
      original_dog_id: scrapedDog.detailedInfo.opprinneligHundId || undefined
    };
  }

  private mapBreedData(scrapedBreed: any): DbBreed {
    return {
      name: scrapedBreed.navn,
      fci_number: scrapedBreed.fciNr || undefined,
      club_id: scrapedBreed.klubbId || undefined,
      club_name: scrapedBreed.klubbNavn || undefined
    };
  }

  // Parse concatenated title strings like "DKCH SECH DKJUCH KLBJCH" into individual titles
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
      'INTCH': 'International Champion',
      'DKJUCH': 'Danish Junior Champion',
      'KLBJCH': 'Club Junior Champion',
      'KLBCH': 'Club Champion',
      'WW': 'World Winner',
      'EW': 'European Winner',
      'NORDCH': 'Nordic Champion'
    };
    return titleMap[titleCode];
  }

  private extractCountryFromTitle(titleCode: string): string | undefined {
    if (titleCode.startsWith('DK')) return 'DK';
    if (titleCode.startsWith('SE')) return 'SE';
    if (titleCode.startsWith('NO')) return 'NO';
    if (titleCode.startsWith('FIN')) return 'FI';
    if (titleCode.includes('INT')) return 'INT';
    return 'DK'; // Default to Denmark
  }

  async syncBreed(scrapedBreed: any): Promise<number> {
    try {
      this.stats.breedsProcessed++;
      const breedData = this.mapBreedData(scrapedBreed);
      
      // Try to find existing breed by name
      const { data: existingBreed, error: findError } = await this.supabase
        .from('breeds')
        .select('id')
        .eq('name', breedData.name)
        .single();

      if (findError && findError.code !== 'PGRST116') { // PGRST116 = not found
        throw findError;
      }

      if (existingBreed) {
        // Update existing breed
        const { error: updateError } = await this.supabase
          .from('breeds')
          .update(breedData)
          .eq('id', existingBreed.id);

        if (updateError) throw updateError;
        this.stats.breedsUpdated++;
        return existingBreed.id;
      } else {
        // Create new breed
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
      this.stats.errors.push(`Breed sync error for ${scrapedBreed.navn}: ${error.message}`);
      console.error('Breed sync error:', error);
      throw error;
    }
  }

  async syncDog(scrapedDog: any, breedId: number): Promise<void> {
    try {
      this.stats.dogsProcessed++;
      const dogData = this.mapDogData(scrapedDog);
      dogData.breed_id = breedId;

      // Try to find existing dog
      const { data: existingDog, error: findError } = await this.supabase
        .from('dogs')
        .select('id')
        .eq('id', dogData.id)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      if (existingDog) {
        // Update existing dog
        const { error: updateError } = await this.supabase
          .from('dogs')
          .update(dogData)
          .eq('id', dogData.id);

        if (updateError) throw updateError;
        this.stats.dogsUpdated++;
      } else {
        // Create new dog
        const { error: insertError } = await this.supabase
          .from('dogs')
          .insert(dogData);

        if (insertError) throw insertError;
        this.stats.dogsCreated++;
      }
    } catch (error) {
      this.stats.errors.push(`Dog sync error for ${scrapedDog.detailedInfo.hundId}: ${error.message}`);
      console.error('Dog sync error:', error);
      throw error;
    }
  }

  async syncTitles(scrapedDog: any): Promise<void> {
    try {
      const dogId = scrapedDog.detailedInfo.hundId;
      const allTitles: DbTitle[] = [];

      // Parse titles from different fields
      if (scrapedDog.detailedInfo.tittel1) {
        allTitles.push(...this.parseTitles(dogId, scrapedDog.detailedInfo.tittel1));
      }
      if (scrapedDog.detailedInfo.tittel2) {
        allTitles.push(...this.parseTitles(dogId, scrapedDog.detailedInfo.tittel2));
      }
      if (scrapedDog.detailedInfo.tittel3) {
        allTitles.push(...this.parseTitles(dogId, scrapedDog.detailedInfo.tittel3));
      }
      if (scrapedDog.detailedInfo.tittel) {
        allTitles.push(...this.parseTitles(dogId, scrapedDog.detailedInfo.tittel));
      }

      if (allTitles.length === 0) return;

      // Delete existing titles for this dog to avoid duplicates
      await this.supabase
        .from('titles')
        .delete()
        .eq('dog_id', dogId);

      // Insert new titles
      for (const title of allTitles) {
        const { error } = await this.supabase
          .from('titles')
          .insert(title);

        if (error) {
          this.stats.errors.push(`Title sync error for ${dogId} (${title.title_code}): ${error.message}`);
        } else {
          this.stats.titlesCreated++;
        }
        this.stats.titlesProcessed++;
      }
    } catch (error) {
      this.stats.errors.push(`Titles sync error for ${scrapedDog.detailedInfo.hundId}: ${error.message}`);
      console.error('Titles sync error:', error);
    }
  }

  async syncPedigree(scrapedDog: any): Promise<void> {
    try {
      const dogId = scrapedDog.detailedInfo.hundId;
      const potentialRelationships: DbPedigreeRelationship[] = [];

      // Add sire (father) relationship
      if (scrapedDog.detailedInfo.farHundId) {
        potentialRelationships.push({
          dog_id: dogId,
          parent_id: scrapedDog.detailedInfo.farHundId,
          relationship_type: 'SIRE',
          generation: 1
        });
      }

      // Add dam (mother) relationship
      if (scrapedDog.detailedInfo.morHundId) {
        potentialRelationships.push({
          dog_id: dogId,
          parent_id: scrapedDog.detailedInfo.morHundId,
          relationship_type: 'DAM',
          generation: 1
        });
      }

      if (potentialRelationships.length === 0) return;

      // Delete existing pedigree relationships for this dog
      await this.supabase
        .from('pedigree_relationships')
        .delete()
        .eq('dog_id', dogId)
        .eq('generation', 1);

      // Check which parent dogs exist and only create relationships for existing dogs
      for (const relationship of potentialRelationships) {
        this.stats.pedigreeProcessed++;

        // Check if parent dog exists
        const { data: parentExists, error: checkError } = await this.supabase
          .from('dogs')
          .select('id')
          .eq('id', relationship.parent_id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // Real error, not just "not found"
          this.stats.errors.push(`Error checking parent ${relationship.parent_id} for ${dogId}: ${checkError.message}`);
          continue;
        }

        if (parentExists) {
          // Parent exists, create the relationship
          const { error: insertError } = await this.supabase
            .from('pedigree_relationships')
            .insert(relationship);

          if (insertError) {
            this.stats.errors.push(`Pedigree sync error for ${dogId} (${relationship.relationship_type}): ${insertError.message}`);
          } else {
            this.stats.pedigreeCreated++;
            console.log(`Created pedigree relationship: ${dogId} -> ${relationship.parent_id} (${relationship.relationship_type})`);
          }
        } else {
          // Parent doesn't exist
          if (this.createPlaceholders) {
            console.log(`Creating placeholder for missing parent: ${relationship.parent_id} (${relationship.relationship_type})`);
            
            // Create a placeholder parent dog record
            await this.createPlaceholderParent(relationship.parent_id, scrapedDog.detailedInfo);
            
            // Try to create the relationship again after creating placeholder
            const { error: insertError } = await this.supabase
              .from('pedigree_relationships')
              .insert(relationship);

            if (insertError) {
              this.stats.errors.push(`Pedigree sync error for ${dogId} (${relationship.relationship_type}) after placeholder creation: ${insertError.message}`);
            } else {
              this.stats.pedigreeCreated++;
              console.log(`Created pedigree relationship with placeholder: ${dogId} -> ${relationship.parent_id} (${relationship.relationship_type})`);
            }
          } else {
            // Skip creating placeholder, just log
            console.log(`Skipping pedigree relationship for ${dogId}: Parent ${relationship.parent_id} (${relationship.relationship_type}) not found in database`);
            this.stats.pedigreeSkipped++;
          }
        }
      }
    } catch (error) {
      this.stats.errors.push(`Pedigree sync error for ${scrapedDog.detailedInfo.hundId}: ${error.message}`);
      console.error('Pedigree sync error:', error);
    }
  }

  private async createPlaceholderParent(parentId: string, childInfo: any): Promise<void> {
    try {
      // Extract parent info from child's data
      const isParentSire = childInfo.farHundId === parentId;
      const parentName = isParentSire ? childInfo.farHundNavn : childInfo.morHundNavn;
      const parentTitles = isParentSire ? childInfo.farTittel : childInfo.morTittel;

      if (!parentName) {
        console.log(`Cannot create placeholder for ${parentId}: No name available`);
        return;
      }

      // Try to determine breed from child (parents likely same breed)
      let breedId = 1; // Default breed ID
      if (childInfo.rase?.navn) {
        const { data: breedData } = await this.supabase
          .from('breeds')
          .select('id')
          .eq('name', childInfo.rase.navn)
          .single();
        
        if (breedData) {
          breedId = breedData.id;
        }
      }

      // Determine gender based on relationship type
      const gender = isParentSire ? 'M' : 'F';

      // Create placeholder parent dog
      const placeholderDog: DbDog = {
        id: parentId,
        name: parentName,
        nickname: undefined,
        gender: gender,
        breed_id: breedId,
        birth_date: undefined,
        death_date: undefined,
        is_deceased: false,
        color: undefined,
        owner_person_id: undefined,
        original_dog_id: undefined
      };

      const { error: insertError } = await this.supabase
        .from('dogs')
        .insert(placeholderDog);

      if (insertError) {
        console.error(`Failed to create placeholder parent ${parentId}:`, insertError.message);
        return;
      }

      console.log(`Created placeholder parent: ${parentId} - ${parentName} (${gender})`);
      this.stats.placeholderDogsCreated++;

      // Create titles for the placeholder parent if available
      if (parentTitles && parentTitles.trim()) {
        const parentTitlesList = this.parseTitles(parentId, parentTitles);
        for (const title of parentTitlesList) {
          await this.supabase
            .from('titles')
            .insert(title);
          this.stats.titlesCreated++;
        }
        console.log(`Added ${parentTitlesList.length} titles for placeholder parent ${parentId}`);
      }

    } catch (error) {
      console.error(`Error creating placeholder parent ${parentId}:`, error);
    }
  }

  // Process pedigree tree data and create ancestor dogs + relationships
  async syncPedigreeTree(childDogId: string, pedigreeTree: any): Promise<void> {
    if (!pedigreeTree || !pedigreeTree.hunder) return;
    
    try {
      this.stats.pedigreeTreesProcessed++;
      console.log(`Processing pedigree tree for ${childDogId} with ${pedigreeTree.hunder.length} ancestors`);
      
      // Process all dogs in the pedigree tree
      for (const pedigreeHund of pedigreeTree.hunder) {
        if (!pedigreeHund.sti || pedigreeHund.sti === '') continue; // Skip if no path (should be the child itself)
        
        try {
          // Create ancestor dog record if it doesn't exist
          await this.createPedigreeAncestor(pedigreeHund);
          
          // Parse the generation and relationship from the path
          const generation = pedigreeHund.sti.length;
          if (generation === 0) continue; // Skip child dog itself
          
          // Create pedigree relationship
          await this.createPedigreeRelationship(childDogId, pedigreeHund, generation);
          
        } catch (error) {
          this.stats.errors.push(`Error processing pedigree ancestor ${pedigreeHund.hundId}: ${error.message}`);
          console.error(`Error processing ancestor ${pedigreeHund.hundId}:`, error);
        }
      }
    } catch (error) {
      this.stats.errors.push(`Pedigree tree sync error for ${childDogId}: ${error.message}`);
      console.error('Pedigree tree sync error:', error);
    }
  }

  // Create ancestor dog record from pedigree tree data
  private async createPedigreeAncestor(pedigreeHund: any): Promise<void> {
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
      // Dog already exists, just update titles if we have them
      if (pedigreeHund.tittel && pedigreeHund.tittel.trim()) {
        const titles = this.parseTitles(pedigreeHund.hundId, pedigreeHund.tittel);
        for (const title of titles) {
          // Check if title already exists to avoid duplicates
          const { data: existingTitle } = await this.supabase
            .from('titles')
            .select('id')
            .eq('dog_id', title.dog_id)
            .eq('title_code', title.title_code)
            .single();
          
          if (!existingTitle) {
            await this.supabase
              .from('titles')
              .insert(title);
          }
        }
      }
      return;
    }

    // Need to create new ancestor dog
    // First determine/create breed
    let breedId = 1; // Default breed ID
    // Note: Pedigree tree data doesn't include breed info, so we use default
    // In a more complete implementation, we could try to infer breed from other dogs
    
    // Determine gender from position in tree (this is approximate)
    // Path ending in '0' is typically father's side, '1' is mother's side
    // But this is not reliable, so we'll leave it unknown for now
    const gender = 'M'; // Default - we'd need better logic to determine this

    const ancestorDog: DbDog = {
      id: pedigreeHund.hundId,
      name: pedigreeHund.navn,
      nickname: undefined,
      gender: gender,
      breed_id: breedId,
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

    this.stats.pedigreeAncestorsCreated++;
    console.log(`Created ancestor dog: ${pedigreeHund.hundId} - ${pedigreeHund.navn}`);

    // Add titles if available
    if (pedigreeHund.tittel && pedigreeHund.tittel.trim()) {
      const titles = this.parseTitles(pedigreeHund.hundId, pedigreeHund.tittel);
      for (const title of titles) {
        await this.supabase
          .from('titles')
          .insert(title);
        this.stats.titlesCreated++;
      }
    }
  }

  // Create pedigree relationship from path information
  private async createPedigreeRelationship(childDogId: string, pedigreeHund: any, generation: number): Promise<void> {
    // The path (sti) tells us the relationship
    // '0' = father's side, '1' = mother's side
    // '00' = father's father, '01' = father's mother, etc.
    
    if (generation > 4) return; // Limit to 4 generations for now
    
    // For generation 1 (direct parents), we can determine SIRE vs DAM
    let relationshipType: 'SIRE' | 'DAM';
    
    if (generation === 1) {
      // Direct parent - '0' = SIRE, '1' = DAM
      relationshipType = pedigreeHund.sti === '0' ? 'SIRE' : 'DAM';
    } else {
      // For higher generations, we determine by the first character of the path
      relationshipType = pedigreeHund.sti.startsWith('0') ? 'SIRE' : 'DAM';
    }

    const relationship: DbPedigreeRelationship = {
      dog_id: childDogId,
      parent_id: pedigreeHund.hundId,
      relationship_type: relationshipType,
      generation: generation
    };

    try {
      const { error: insertError } = await this.supabase
        .from('pedigree_relationships')
        .upsert(relationship, { onConflict: 'dog_id,parent_id,relationship_type' });

      if (insertError) {
        throw insertError;
      }

      console.log(`Created pedigree relationship: ${childDogId} -> ${pedigreeHund.hundId} (${relationshipType}, gen ${generation})`);
    } catch (error) {
      this.stats.errors.push(`Error creating pedigree relationship ${childDogId} -> ${pedigreeHund.hundId}: ${error.message}`);
    }
  }

  async syncDogData(scrapedDogs: ScrapedDog[]): Promise<SyncStats> {
    console.log(`Starting sync of ${scrapedDogs.length} dogs...`);

    // Keep track of unique breeds to avoid duplicate processing
    const processedBreeds = new Map<string, number>();

    for (const scrapedDog of scrapedDogs) {
      try {
        if (!scrapedDog.detailedInfo || scrapedDog.detailedInfo.error) {
          this.stats.errors.push(`Skipping dog ${scrapedDog.basicInfo?.id}: No detailed info available`);
          continue;
        }

        // Sync breed first
        let breedId: number;
        const breedName = scrapedDog.detailedInfo.rase?.navn;
        
        if (!breedName) {
          this.stats.errors.push(`Skipping dog ${scrapedDog.detailedInfo.hundId}: No breed information`);
          continue;
        }

        if (processedBreeds.has(breedName)) {
          breedId = processedBreeds.get(breedName)!;
        } else {
          breedId = await this.syncBreed(scrapedDog.detailedInfo.rase);
          processedBreeds.set(breedName, breedId);
        }

        // Sync dog
        await this.syncDog(scrapedDog, breedId);

        // Sync titles
        await this.syncTitles(scrapedDog);

        // Sync pedigree relationships
        await this.syncPedigree(scrapedDog);

        // Sync deeper pedigree tree if available
        if (scrapedDog.pedigreeTree) {
          console.log(`Syncing pedigree tree for: ${scrapedDog.detailedInfo.hundId}`);
          await this.syncPedigreeTree(scrapedDog.detailedInfo.hundId, scrapedDog.pedigreeTree);
        }

        console.log(`Synced dog: ${scrapedDog.detailedInfo.hundId} - ${scrapedDog.detailedInfo.navn}`);

      } catch (error) {
        this.stats.errors.push(`Failed to sync dog ${scrapedDog.detailedInfo?.hundId || 'unknown'}: ${error.message}`);
        console.error('Error syncing dog:', error);
      }
    }

    console.log('Sync completed:', this.stats);
    return this.stats;
  }

  getStats(): SyncStats {
    return this.stats;
  }
}

class HundewebScraper {
  username;
  password;
  loginUrl;
  dogDetailsBaseUrl;
  cookies;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
    this.loginUrl = "https://www.hundeweb.dk/dkk/secure/openIndex?ARTICLE_ID=6";
    this.dogDetailsBaseUrl = "https://www.hundeweb.dk/dkk-hundedatabase-backend/rest/hund";
    this.cookies = "";
  }

  async login() {
    try {
      console.log("Starting login process...");
      console.log(`Login URL: ${this.loginUrl}`);
      // First, get the login page to extract any necessary tokens/cookies
      const loginPageResponse = await fetch(this.loginUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
      console.log(`Login page response status: ${loginPageResponse.status}`);
      if (!loginPageResponse.ok) {
        throw new Error(`Failed to load login page: ${loginPageResponse.status}`);
      }
      // Extract cookies from the response
      const setCookieHeaders = loginPageResponse.headers.get("set-cookie");
      console.log(`Set-Cookie headers:`, setCookieHeaders);
      if (setCookieHeaders) {
        this.cookies = setCookieHeaders.split(',').map((cookie) => cookie.split(';')[0]).join('; ');
        console.log(`Extracted cookies: ${this.cookies}`);
      }
      const loginPageHtml = await loginPageResponse.text();
      console.log("Login page loaded, checking for CAS redirect...");
      // Check if we're being redirected to CAS
      if (loginPageHtml.includes('cas/login') || loginPageResponse.url.includes('cas/login')) {
        console.log("Detected CAS authentication system, following redirect...");
        return await this.handleCASLogin();
      }
      // Original login logic (keep as fallback)
      return await this.handleStandardLogin(loginPageHtml);
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error stack:", error.stack);
      return false;
    }
  }

  async handleCASLogin() {
    try {
      // Step 1: Go to the CAS login page
      const casLoginUrl = "https://www.hundeweb.dk/cas/login?locale=da&service=https%3A%2F%2Fwww.hundeweb.dk%2Fdkk-hundedatabase-backend%2Flogin%2Fcas";
      console.log(`Accessing CAS login page: ${casLoginUrl}`);
      const casPageResponse = await fetch(casLoginUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Cookie": this.cookies
        }
      });
      console.log(`CAS page response status: ${casPageResponse.status}`);
      // Update cookies from CAS page
      const casSetCookieHeaders = casPageResponse.headers.get("set-cookie");
      if (casSetCookieHeaders) {
        const newCookies = casSetCookieHeaders.split(',').map((cookie) => cookie.split(';')[0]).join('; ');
        this.cookies = this.cookies ? `${this.cookies}; ${newCookies}` : newCookies;
        console.log(`Updated cookies after CAS page: ${this.cookies}`);
      }
      const casPageHtml = await casPageResponse.text();
      console.log(`CAS page HTML length: ${casPageHtml.length}`);
      // Extract form action and hidden fields from CAS form
      const actionMatch = casPageHtml.match(/<form[^>]*action="([^"]+)"/i);
      const formAction = actionMatch ? actionMatch[1] : "/cas/login";
      console.log(`CAS form action: ${formAction}`);
      // Extract hidden fields (CAS typically uses lt, execution tokens)
      const hiddenFields = {};
      const hiddenMatches = casPageHtml.matchAll(/<input[^>]*type="hidden"[^>]*name="([^"]+)"[^>]*value="([^"]*)"[^>]*>/gi);
      for (const match of hiddenMatches) {
        hiddenFields[match[1]] = match[2];
        console.log(`CAS hidden field: ${match[1]} = ${match[2]}`);
      }
      // Look for actual username/password field names in CAS form
      const usernameMatch = casPageHtml.match(/<input[^>]*name="([^"]*username[^"]*)"[^>]*/i) || casPageHtml.match(/<input[^>]*name="([^"]*user[^"]*)"[^>]*/i);
      const passwordMatch = casPageHtml.match(/<input[^>]*name="([^"]*password[^"]*)"[^>]*/i);
      const usernameField = usernameMatch ? usernameMatch[1] : 'username';
      const passwordField = passwordMatch ? passwordMatch[1] : 'password';
      console.log(`CAS username field: ${usernameField}`);
      console.log(`CAS password field: ${passwordField}`);
      // Prepare CAS login data
      const casLoginData = new URLSearchParams({
        ...hiddenFields,
        [usernameField]: this.username,
        [passwordField]: this.password
      });
      console.log(`CAS login data: ${casLoginData.toString()}`);
      // Submit CAS login
      const casSubmitUrl = formAction.startsWith('http') ? formAction : `https://www.hundeweb.dk${formAction}`;
      console.log(`Submitting CAS login to: ${casSubmitUrl}`);
      const casLoginResponse = await fetch(casSubmitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": casLoginUrl,
          "Cookie": this.cookies
        },
        body: casLoginData.toString(),
        redirect: "manual"
      });
      console.log(`CAS login response status: ${casLoginResponse.status}`);
      // Update cookies from CAS login response
      const casLoginSetCookieHeaders = casLoginResponse.headers.get("set-cookie");
      if (casLoginSetCookieHeaders) {
        const newCookies = casLoginSetCookieHeaders.split(',').map((cookie) => cookie.split(';')[0]).join('; ');
        this.cookies = this.cookies ? `${this.cookies}; ${newCookies}` : newCookies;
        console.log(`Final cookies after CAS login: ${this.cookies}`);
      }
      // Check for successful login (usually a redirect)
      if (casLoginResponse.status === 302) {
        const location = casLoginResponse.headers.get('location');
        console.log(`CAS redirect location: ${location}`);
        // Follow the redirect to complete the authentication
        if (location) {
          const finalResponse = await fetch(location, {
            method: "GET",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              "Cookie": this.cookies
            },
            redirect: "manual"
          });
          console.log(`Final redirect response status: ${finalResponse.status}`);
          // Update cookies from final response
          const finalSetCookieHeaders = finalResponse.headers.get("set-cookie");
          if (finalSetCookieHeaders) {
            const newCookies = finalSetCookieHeaders.split(',').map((cookie) => cookie.split(';')[0]).join('; ');
            this.cookies = this.cookies ? `${this.cookies}; ${newCookies}` : newCookies;
          }
        }
        console.log("CAS login appears successful");
        return true;
      } else {
        console.log(`CAS login failed - status: ${casLoginResponse.status}`);
        const responseText = await casLoginResponse.text();
        console.log(`CAS response body snippet: ${responseText.substring(0, 500)}`);
        return false;
      }
    } catch (error) {
      console.error("CAS login error:", error);
      return false;
    }
  }

  async handleStandardLogin(loginPageHtml) {
    // Original login logic
    const actionMatch = loginPageHtml.match(/action="([^"]+)"/);
    const formAction = actionMatch ? actionMatch[1] : "/dkk/secure/openIndex";
    console.log(`Standard form action found: ${formAction}`);
    const hiddenFields = {};
    const hiddenMatches = loginPageHtml.matchAll(/<input[^>]*type="hidden"[^>]*name="([^"]+)"[^>]*value="([^"]*)"[^>]*>/gi);
    for (const match of hiddenMatches) {
      hiddenFields[match[1]] = match[2];
      console.log(`Standard hidden field found: ${match[1]} = ${match[2]}`);
    }
    const loginData = new URLSearchParams({
      ...hiddenFields,
      username: this.username,
      password: this.password,
      login: "Login",
      submit: "Login"
    });
    console.log("Attempting standard login...");
    const loginResponse = await fetch(`https://www.hundeweb.dk${formAction}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": this.loginUrl,
        "Cookie": this.cookies
      },
      body: loginData.toString(),
      redirect: "manual"
    });
    const newSetCookieHeaders = loginResponse.headers.get("set-cookie");
    if (newSetCookieHeaders) {
      const newCookies = newSetCookieHeaders.split(',').map((cookie) => cookie.split(';')[0]).join('; ');
      this.cookies = this.cookies ? `${this.cookies}; ${newCookies}` : newCookies;
    }
    console.log(`Standard login response status: ${loginResponse.status}`);
    return loginResponse.status === 302 || loginResponse.status === 200;
  }

  async fetchDogDetails(dogId: string) {
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
          "Cookie": this.cookies,
          "Referer": "https://www.hundeweb.dk/hundedatabase/hund"
        },
        mode: "cors",
        credentials: "include"
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Dog ${dogId} not found in DKK database (404)`);
          return { error: 'DOG_NOT_FOUND', status: 404 };
        }
        if (response.status === 403 || response.status === 401) {
          console.log(`Access denied for dog ${dogId} (${response.status})`);
          return { error: 'ACCESS_DENIED', status: response.status };
        }
        
        console.error(`Dog details fetch failed for ${dogId}: ${response.status} ${response.statusText}`);
        const responseText = await response.text();
        console.error("Response body:", responseText);
        throw new Error(`Failed to fetch details for dog ${dogId}: ${response.status} ${response.statusText}`);
      }
      
      const details = await response.json();
      console.log(`Successfully fetched details for dog: ${dogId}`);
      return details;
    } catch (error) {
      console.error(`Error fetching details for dog ${dogId}:`, error);
      throw error;
    }
  }

  async fetchPedigreeTree(farHundId: string | null, morHundId: string | null, generations = 4) {
    try {
      if (!farHundId && !morHundId) {
        console.log("No parent IDs provided for pedigree tree");
        return null;
      }
      
      const params = new URLSearchParams({
        antallGenerasjonerInnavlsberegning: '3',
        antallGenerasjonerStamtavle: generations.toString(),
        fiktiv: 'false'
      });
      
      if (farHundId) params.append('farHundId', farHundId);
      if (morHundId) params.append('morHundId', morHundId);
      
      const url = `https://www.hundeweb.dk/dkk-hundedatabase-backend/rest/hund/stamtavleTre?${params.toString()}`;
      console.log(`Fetching pedigree tree for father: ${farHundId || 'N/A'}, mother: ${morHundId || 'N/A'}`);
      
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
          "Cookie": this.cookies,
          "Referer": "https://www.hundeweb.dk/hundedatabase/hund"
        },
        mode: "cors",
        credentials: "include"
      });
      
      if (!response.ok) {
        console.error(`Pedigree tree fetch failed: ${response.status} ${response.statusText}`);
        const responseText = await response.text();
        console.error("Response body:", responseText);
        return null; // Don't throw, just return null as this is supplementary data
      }
      
      const pedigreeData = await response.json();
      console.log(`Successfully fetched pedigree tree with ${pedigreeData.hunder?.length || 0} dogs`);
      return pedigreeData;
    } catch (error) {
      console.error("Error fetching pedigree tree:", error);
      return null; // Don't throw, just return null as this is supplementary data
    }
  }

  async scrapeMyDogsList(dogIds: string[]): Promise<SyncResult> {
    try {
      // Step 1: Login
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        return {
          success: false,
          processedDogsCount: 0,
          dogs: [],
          skippedDogIds: [],
          error: "Failed to login to hundeweb.dk"
        };
      }

      // Step 2: Fetch details and pedigree for each dog ID from the database
      const dogsWithDetails: ScrapedDog[] = [];
      const skippedDogIds: string[] = [];

      console.log(`Processing ${dogIds.length} dogs from my_dogs table...`);

      for (const dogId of dogIds) {
        try {
          console.log(`Processing dog ID: ${dogId}`);
          const details = await this.fetchDogDetails(dogId);
          
          // Handle cases where dog doesn't exist or access is denied
          if (details.error) {
            if (details.error === 'DOG_NOT_FOUND') {
              console.log(`Dog ${dogId} not found in DKK database, skipping...`);
              skippedDogIds.push(dogId);
              continue;
            } else if (details.error === 'ACCESS_DENIED') {
              console.log(`Access denied for dog ${dogId}, skipping...`);
              skippedDogIds.push(dogId);
              continue;
            }
          }
          
          // Also fetch pedigree tree if parent information is available
          let pedigreeTree = null;
          if (details.farHundId || details.morHundId) {
            console.log(`Fetching pedigree tree for ${dogId}`);
            pedigreeTree = await this.fetchPedigreeTree(details.farHundId, details.morHundId);
            // Add extra delay after pedigree fetch since it's a more complex query
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
          
          dogsWithDetails.push({
            basicInfo: { id: dogId }, // Minimal basic info since we don't have the full dog list
            detailedInfo: details,
            pedigreeTree: pedigreeTree
          });
          
          console.log(`Successfully processed dog: ${dogId} - ${details.navn || 'Unknown'}`);
          
          // Add a small delay to be respectful to the server
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to fetch details for dog ${dogId}:`, error);
          // Continue with other dogs even if one fails
          dogsWithDetails.push({
            basicInfo: { id: dogId },
            detailedInfo: {
              hundId: dogId,
              error: `Failed to fetch details: ${error.message}`
            },
            pedigreeTree: null
          });
          skippedDogIds.push(dogId);
        }
      }

      console.log(`Completed processing. Successful: ${dogsWithDetails.length}, Skipped: ${skippedDogIds.length}`);

      return {
        success: true,
        processedDogsCount: dogsWithDetails.length,
        dogs: dogsWithDetails,
        skippedDogIds: skippedDogIds
      };
    } catch (error) {
      console.error("Scraping error:", error);
      return {
        success: false,
        processedDogsCount: 0,
        dogs: [],
        skippedDogIds: [],
        error: error.message
      };
    }
  }

  async scrapeAndSyncMyDogs(dogIds: string[], dataSyncer: DataSyncer): Promise<SyncResult> {
    try {
      // First scrape the data for the specific dog IDs
      const scrapingResult = await this.scrapeMyDogsList(dogIds);
      
      if (!scrapingResult.success) {
        return scrapingResult;
      }

      // Sync to database
      console.log("Starting database sync for scraped dogs...");
      const syncStats = await dataSyncer.syncDogData(scrapingResult.dogs);

      return {
        success: true,
        processedDogsCount: scrapingResult.processedDogsCount,
        dogs: scrapingResult.dogs,
        skippedDogIds: scrapingResult.skippedDogIds,
        syncStats: syncStats
      };
    } catch (error) {
      console.error("Scraping and sync error:", error);
      return {
        success: false,
        processedDogsCount: 0,
        dogs: [],
        skippedDogIds: [],
        error: error.message,
        syncStats: null
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
    return new Response(null, {
      headers: corsHeaders
    });
  }

  // Allow both GET and POST requests
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    // Get credentials from Supabase secrets (environment variables)
    // @ts-ignore
    const username = Deno.env.get('HUNDEWEB_USERNAME');
    // @ts-ignore
    const password = Deno.env.get('HUNDEWEB_PASSWORD');
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!username || !password || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return new Response(JSON.stringify({
        error: 'Server configuration error: Missing required credentials',
        success: false
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Parse URL parameters
    const url = new URL(req.url);
    const createPlaceholders = url.searchParams.get('placeholders') !== 'false'; // Default to true
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : null;
    
    console.log(`Starting sync process for my dogs`);
    console.log(`Create placeholders: ${createPlaceholders}`);
    console.log(`Limit: ${limit || 'No limit'}`);
    
    // Initialize Supabase client to fetch dog IDs from my_dogs table
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch dog IDs from my_dogs table
    console.log('Fetching dog IDs from my_dogs table...');
    let query = supabase
      .from('my_dogs')
      .select('dog_id')
      .order('created_at', { ascending: false });
    
    if (limit && limit > 0) {
      query = query.limit(limit);
    }
    
    const { data: myDogsData, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('Error fetching dog IDs from my_dogs table:', fetchError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch dog IDs from database',
        details: fetchError.message,
        success: false
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    if (!myDogsData || myDogsData.length === 0) {
      console.log('No dogs found in my_dogs table');
      return new Response(JSON.stringify({
        success: true,
        processedDogsCount: 0,
        dogs: [],
        skippedDogIds: [],
        message: 'No dogs found in my_dogs table to process',
        syncStats: {
          breedsProcessed: 0,
          breedsCreated: 0,
          breedsUpdated: 0,
          dogsProcessed: 0,
          dogsCreated: 0,
          dogsUpdated: 0,
          placeholderDogsCreated: 0,
          titlesProcessed: 0,
          titlesCreated: 0,
          pedigreeProcessed: 0,
          pedigreeCreated: 0,
          pedigreeSkipped: 0,
          pedigreeTreesProcessed: 0,
          pedigreeAncestorsCreated: 0,
          errors: [],
          dogNotFoundCount: 0,
          dogAccessDeniedCount: 0
        }
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    const dogIds = myDogsData.map(row => row.dog_id);
    console.log(`Found ${dogIds.length} dogs in my_dogs table:`, dogIds);
    
    // Create scraper and syncer instances
    const scraper = new HundewebScraper(username, password);
    const dataSyncer = new DataSyncer(supabaseUrl, supabaseServiceKey, createPlaceholders);
    
    // Run scraping and syncing for the specific dog IDs
    const result = await scraper.scrapeAndSyncMyDogs(dogIds, dataSyncer);
    
    console.log(`Processing completed. Success: ${result.success}, Processed: ${result.processedDogsCount}, Skipped: ${result.skippedDogIds.length}`);
    if (result.syncStats) {
      console.log('Sync stats:', result.syncStats);
    }
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message,
      success: false
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});