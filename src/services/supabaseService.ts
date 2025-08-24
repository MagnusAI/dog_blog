import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on our schema
export interface Breed {
  id: number;
  name: string;
  fci_number?: string;
  club_id?: string;
  club_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Dog {
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
  created_at: string;
  updated_at: string;
  breed?: Breed;
  titles?: Title[];
  pedigree_sire?: { parent: Dog & { titles?: Title[] } }[];
  pedigree_dam?: { parent: Dog & { titles?: Title[] } }[];
  offspring_as_sire?: { offspring: Dog & { breed?: Breed } }[];
  offspring_as_dam?: { offspring: Dog & { breed?: Breed } }[];
  my_dogs?: MyDog[];
}

export interface Title {
  id: number;
  dog_id: string;
  title_code: string;
  title_full_name?: string;
  country_code?: string;
  year_earned?: number;
  created_at: string;
  updated_at: string;
}

export interface PedigreeRelationship {
  id: number;
  dog_id: string;
  parent_id: string;
  relationship_type: 'SIRE' | 'DAM';
  generation: number;
  created_at: string;
  updated_at: string;
  parent?: Dog;
}

export interface MyDog {
  id: number;
  dog_id: string;
  acquisition_date?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  dog?: Dog;
}

// Service functions
export const dogService = {
  // Breeds
  async getBreeds(): Promise<Breed[]> {
    const { data, error } = await supabase
      .from('breeds')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async createBreed(breed: Omit<Breed, 'id' | 'created_at' | 'updated_at'>): Promise<Breed> {
    const { data, error } = await supabase
      .from('breeds')
      .insert(breed)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateBreed(id: number, updates: Partial<Breed>): Promise<Breed> {
    const { data, error } = await supabase
      .from('breeds')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteBreed(id: number): Promise<void> {
    const { error } = await supabase
      .from('breeds')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Dogs
  async getDogs(limit?: number): Promise<Dog[]> {
    let query = supabase
      .from('dogs')
      .select(`
        *,
        breed:breeds(*)
      `)
      .order('name');
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getDogById(id: string): Promise<Dog | null> {
    const { data, error } = await supabase
      .from('dogs')
      .select(`
        *,
        breed:breeds(*),
        titles(*),
        pedigree_sire:pedigree_relationships!fk_pedigree_dog(
          parent:dogs!fk_pedigree_parent(
            *,
            breed:breeds(*),
            titles(*)
          ),
          relationship_type
        ),
        pedigree_dam:pedigree_relationships!fk_pedigree_dog(
          parent:dogs!fk_pedigree_parent(
            *,
            breed:breeds(*),
            titles(*)
          ),
          relationship_type
        ),
        my_dogs(*),
        offspring_as_sire:pedigree_relationships!fk_pedigree_parent(
          offspring:dogs!fk_pedigree_dog(
            *,
            breed:breeds(*)
          ),
          relationship_type
        ),
        offspring_as_dam:pedigree_relationships!fk_pedigree_parent(
          offspring:dogs!fk_pedigree_dog(
            *,
            breed:breeds(*)
          ),
          relationship_type
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  async getDog(id: string): Promise<Dog | null> {
    const { data, error } = await supabase
      .from('dogs')
      .select(`
        *,
        breed:breeds(*),
        titles(*),
        pedigree_relationships_dog_id_fkey(
          *,
          parent:dogs(*)
        ),
        my_dogs(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createDog(dog: Omit<Dog, 'id' | 'created_at' | 'updated_at'>): Promise<Dog> {
    const { data, error } = await supabase
      .from('dogs')
      .insert(dog)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateDog(id: string, updates: Partial<Dog>): Promise<Dog> {
    const { data, error } = await supabase
      .from('dogs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteDog(id: string): Promise<void> {
    const { error } = await supabase
      .from('dogs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Titles
  async getDogTitles(dogId: string): Promise<Title[]> {
    const { data, error } = await supabase
      .from('titles')
      .select('*')
      .eq('dog_id', dogId)
      .order('year_earned', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async addTitle(title: Omit<Title, 'id' | 'created_at' | 'updated_at'>): Promise<Title> {
    const { data, error } = await supabase
      .from('titles')
      .insert(title)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTitle(id: number, updates: Partial<Title>): Promise<Title> {
    const { data, error } = await supabase
      .from('titles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTitle(id: number): Promise<void> {
    const { error } = await supabase
      .from('titles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Pedigree relationships
  async getDogPedigree(dogId: string): Promise<PedigreeRelationship[]> {
    const { data, error } = await supabase
      .from('pedigree_relationships')
      .select(`
        *,
        parent:dogs(*)
      `)
      .eq('dog_id', dogId)
      .order('relationship_type');
    
    if (error) throw error;
    return data || [];
  },

  async addPedigreeRelationship(
    relationship: Omit<PedigreeRelationship, 'id' | 'created_at' | 'updated_at'>
  ): Promise<PedigreeRelationship> {
    const { data, error } = await supabase
      .from('pedigree_relationships')
      .insert(relationship)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deletePedigreeRelationship(id: number): Promise<void> {
    const { error } = await supabase
      .from('pedigree_relationships')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

    // My Dogs
  async getMyDogs(): Promise<MyDog[]> {
    const { data, error } = await supabase
      .from('my_dogs')
      .select(`
        *,
        dog:dogs(
          *,
          breed:breeds(*)
        )
      `)
      .eq('is_active', true)
      .order('acquisition_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async addToMyDogs(myDog: Omit<MyDog, 'id' | 'created_at' | 'updated_at'>): Promise<MyDog> {
    const { data, error } = await supabase
      .from('my_dogs')
      .insert(myDog)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateMyDog(id: number, updates: Partial<MyDog>): Promise<MyDog> {
    const { data, error } = await supabase
      .from('my_dogs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removeFromMyDogs(dogId: string): Promise<void> {
    const { error } = await supabase
      .from('my_dogs')
      .delete()
      .eq('dog_id', dogId);
    
    if (error) throw error;
  },

  // Search dogs for pedigree selection
  async searchDogs(query: string): Promise<Dog[]> {
    const { data, error } = await supabase
      .from('dogs')
      .select(`
        *,
        breed:breeds(*)
      `)
      .or(`name.ilike.%${query}%,id.ilike.%${query}%`)
      .order('name')
      .limit(20);
    
    if (error) throw error;
    return data || [];
  }
};

