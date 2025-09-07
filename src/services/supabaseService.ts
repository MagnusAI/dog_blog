import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication service
export const authService = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

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
  all_ancestors?: { parent: Dog & { titles?: Title[], breed?: Breed, profile_image?: DogImage[] }, relationship_type: 'SIRE' | 'DAM', generation: number, path?: string }[];
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
  path?: string;
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

export interface DogImage {
  id: number;
  dog_id: string;
  image_url: string;
  image_public_id: string;
  is_profile: boolean;
  image_type: 'profile' | 'gallery' | 'medical' | 'pedigree';
  alt_text?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContentSection {
  id: string;
  section_key: string;
  title: string;
  content: string;
  section_type: 'text' | 'list' | 'card';
  page: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentSectionCreateData {
  section_key: string;
  title: string;
  content: string;
  section_type?: 'text' | 'list' | 'card';
  page: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ContentSectionUpdateData {
  title?: string;
  content?: string;
  section_type?: 'text' | 'list' | 'card';
  sort_order?: number;
  is_active?: boolean;
}

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  image_alt?: string;
  image_public_id?: string;
  fallback_image_url?: string;
  published_date: string;
  created_at: string;
  updated_at: string;
  author_id?: string;
  slug?: string;
  meta_description?: string;
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
  // Relations
  tagged_dogs?: Dog[];
  author?: any; // auth.users data
}

export interface NewsPostDog {
  id: string;
  news_post_id: string;
  dog_id: string; // VARCHAR(50) to match dogs.id
  created_at: string;
}

export interface CreateNewsPostData {
  title: string;
  content: string;
  image_url?: string;
  image_alt?: string;
  image_public_id?: string;
  fallback_image_url?: string;
  published_date?: string;
  slug?: string;
  meta_description?: string;
  featured?: boolean;
  status?: 'draft' | 'published' | 'archived';
  tagged_dog_ids?: string[];
}

export interface UpdateNewsPostData extends Partial<CreateNewsPostData> {
  id: string;
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
        all_ancestors:pedigree_relationships!fk_pedigree_dog(
          parent:dogs!fk_pedigree_parent(
            *,
            breed:breeds(*),
            titles(*),
            profile_image:dog_images!dog_id(*)
          ),
          relationship_type,
          generation,
          path
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
        my_dogs(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
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
      .order('generation')
      .order('path');

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

  // Upsert dog and add to my_dogs (for the "Add New Dog" functionality)
  async upsertDogAndAddToMyDogs(
    dogData: Omit<Dog, 'created_at' | 'updated_at'>,
    myDogData?: Partial<Omit<MyDog, 'id' | 'dog_id' | 'created_at' | 'updated_at'>>
  ): Promise<{ dog: Dog; myDog: MyDog }> {
    // First, upsert the dog (create or update)
    const { data: dog, error: dogError } = await supabase
      .from('dogs')
      .upsert(dogData, { onConflict: 'id' })
      .select()
      .single();

    if (dogError) throw dogError;

    // Check if this dog is already in my_dogs
    const { data: existingMyDog } = await supabase
      .from('my_dogs')
      .select('*')
      .eq('dog_id', dog.id)
      .single();

    let myDog: MyDog;
    
    if (existingMyDog) {
      // Dog is already in my_dogs, just return it (or update if needed)
      if (myDogData && Object.keys(myDogData).length > 0) {
        const { data: updatedMyDog, error: updateError } = await supabase
          .from('my_dogs')
          .update(myDogData)
          .eq('id', existingMyDog.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        myDog = updatedMyDog;
      } else {
        myDog = existingMyDog;
      }
    } else {
      // Add to my_dogs
      const { data: newMyDog, error: myDogError } = await supabase
        .from('my_dogs')
        .insert({
          dog_id: dog.id,
          ...myDogData
        })
        .select()
        .single();

      if (myDogError) throw myDogError;
      myDog = newMyDog;
    }

    return { dog, myDog };
  },

  // Check if a dog exists by ID
  async checkDogExists(dogId: string): Promise<Dog | null> {
    const { data, error } = await supabase
      .from('dogs')
      .select(`
        *,
        breed:breeds(*)
      `)
      .eq('id', dogId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned, dog doesn't exist
        return null;
      }
      throw error;
    }

    return data;
  },

  // Clear pedigree relationships for a specific dog and relationship type
  async clearPedigreeRelationships(dogId: string, relationshipType: 'SIRE' | 'DAM'): Promise<void> {
    const { error } = await supabase
      .from('pedigree_relationships')
      .delete()
      .eq('dog_id', dogId)
      .eq('relationship_type', relationshipType);

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
  },

  // Dog Images
  async getDogImages(dogId: string): Promise<DogImage[]> {
    try {
      const { data, error } = await supabase
        .from('dog_images')
        .select('*')
        .eq('dog_id', dogId)
        .order('is_profile', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      // Handle case where dog_images table doesn't exist yet (migration not applied)
      if (error.code === 'PGRST106' || error.message?.includes('dog_images') || error.status === 406) {
        console.info('🗂️ dog_images table not yet available - run "npx supabase db push" to enable image features');
        return [];
      }
      throw error;
    }
  },

  async getDogProfileImage(dogId: string): Promise<DogImage | null> {
    const { data, error } = await supabase
      .from('dog_images')
      .select('*')
      .eq('dog_id', dogId)
      .eq('is_profile', true)
      .single();

    if (error) {
      console.error('Error fetching profile image:', error);
      return null; // Return null instead of throwing
    }
    return data;
  },

  async addDogImage(image: Omit<DogImage, 'id' | 'created_at' | 'updated_at'>): Promise<DogImage> {
    const { data, error } = await supabase
      .from('dog_images')
      .insert(image)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDogImage(id: number, updates: Partial<DogImage>): Promise<DogImage> {
    const { data, error } = await supabase
      .from('dog_images')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDogImage(id: number): Promise<void> {
    const { error } = await supabase
      .from('dog_images')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async setProfileImage(dogId: string, imageId: number): Promise<void> {
    // The trigger will automatically handle unsetting other profile images
    const { error } = await supabase
      .from('dog_images')
      .update({ is_profile: true })
      .eq('id', imageId)
      .eq('dog_id', dogId);

    if (error) throw error;
  },

  async reorderDogImages(imageUpdates: { id: number; display_order: number }[]): Promise<void> {
    // Update multiple images' display order in a transaction-like manner
    const updates = imageUpdates.map(({ id, display_order }) =>
      supabase
        .from('dog_images')
        .update({ display_order })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(result => result.error);

    if (errors.length > 0) {
      throw new Error(`Failed to reorder images: ${errors.map(e => e.error?.message).join(', ')}`);
    }
  }
};

// News Service
export const newsService = {
  // Get all published news posts
  async getPublishedNewsPosts(): Promise<NewsPost[]> {
    const { data, error } = await supabase
      .from('news_posts')
      .select(`
        *,
        tagged_dogs:news_posts_dogs(
          dog:dogs(*)
        )
      `)
      .eq('status', 'published')
      .order('published_date', { ascending: false });

    if (error) throw error;

    // Transform the data to match our interface
    return data?.map(post => ({
      ...post,
      tagged_dogs: post.tagged_dogs?.map((td: any) => td.dog).filter(Boolean) || []
    })) || [];
  },

  // Get featured news post
  async getFeaturedNewsPost(): Promise<NewsPost | null> {
    const { data, error } = await supabase
      .from('news_posts')
      .select(`
        *,
        tagged_dogs:news_posts_dogs(
          dog:dogs(*)
        )
      `)
      .eq('status', 'published')
      .eq('featured', true)
      .order('published_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    // Transform the data to match our interface
    return {
      ...data,
      tagged_dogs: data.tagged_dogs?.map((td: any) => td.dog).filter(Boolean) || []
    };
  },

  // Get news post by ID
  async getNewsPostById(id: string): Promise<NewsPost | null> {
    const { data, error } = await supabase
      .from('news_posts')
      .select(`
        *,
        tagged_dogs:news_posts_dogs(
          dog:dogs(*)
        )
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      ...data,
      tagged_dogs: data.tagged_dogs?.map((td: any) => td.dog).filter(Boolean) || []
    };
  },

  // Get news post by slug
  async getNewsPostBySlug(slug: string): Promise<NewsPost | null> {
    const { data, error } = await supabase
      .from('news_posts')
      .select(`
        *,
        tagged_dogs:news_posts_dogs(
          dog:dogs(*)
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      ...data,
      tagged_dogs: data.tagged_dogs?.map((td: any) => td.dog).filter(Boolean) || []
    };
  },

  // Get user's own news posts (including drafts)
  async getUserNewsPosts(): Promise<NewsPost[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('news_posts')
      .select(`
        *,
        tagged_dogs:news_posts_dogs(
          dog:dogs(*)
        )
      `)
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(post => ({
      ...post,
      tagged_dogs: post.tagged_dogs?.map((td: any) => td.dog).filter(Boolean) || []
    })) || [];
  },

  // Create news post
  async createNewsPost(newsPostData: CreateNewsPostData): Promise<NewsPost> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { tagged_dog_ids, ...postData } = newsPostData;

    // Create the news post
    const { data: newsPost, error: postError } = await supabase
      .from('news_posts')
      .insert({
        ...postData,
        author_id: user.id
      })
      .select()
      .single();

    if (postError) throw postError;

    // Add dog tags if provided
    if (tagged_dog_ids && tagged_dog_ids.length > 0) {
      const dogTags = tagged_dog_ids.map(dogId => ({
        news_post_id: newsPost.id,
        dog_id: dogId
      }));

      const { error: tagsError } = await supabase
        .from('news_posts_dogs')
        .insert(dogTags);

      if (tagsError) throw tagsError;
    }

    // Return the complete news post with tags
    const updatedPost = await this.getNewsPostById(newsPost.id);
    return updatedPost || newsPost;
  },

  // Update news post
  async updateNewsPost(updateData: UpdateNewsPostData): Promise<NewsPost> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { id, tagged_dog_ids, ...postData } = updateData;

    // Update the news post
    const { data: newsPost, error: postError } = await supabase
      .from('news_posts')
      .update(postData)
      .eq('id', id)
      .eq('author_id', user.id) // Ensure user owns the post
      .select()
      .single();

    if (postError) throw postError;

    // Update dog tags if provided
    if (tagged_dog_ids !== undefined) {
      // Remove existing tags
      await supabase
        .from('news_posts_dogs')
        .delete()
        .eq('news_post_id', id);

      // Add new tags
      if (tagged_dog_ids.length > 0) {
        const dogTags = tagged_dog_ids.map(dogId => ({
          news_post_id: id,
          dog_id: dogId
        }));

        const { error: tagsError } = await supabase
          .from('news_posts_dogs')
          .insert(dogTags);

        if (tagsError) throw tagsError;
      }
    }

    // Return the complete news post with tags
    const updatedPost = await this.getNewsPostById(id);
    return updatedPost || newsPost;
  },

  // Delete news post
  async deleteNewsPost(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('news_posts')
      .delete()
      .eq('id', id)
      .eq('author_id', user.id); // Ensure user owns the post

    if (error) throw error;
  },

  // Toggle featured status (admin function)
  async toggleFeatured(id: string): Promise<NewsPost> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First, un-feature all other posts
    await supabase
      .from('news_posts')
      .update({ featured: false })
      .neq('id', id);

    // Then feature/unfeature the target post
    const { data: newsPost, error } = await supabase
      .from('news_posts')
      .update({ featured: true })
      .eq('id', id)
      .eq('author_id', user.id)
      .select()
      .single();

    if (error) throw error;

    const updatedPost = await this.getNewsPostById(id);
    return updatedPost || newsPost;
  }
};

// Content management service
export const contentService = {
  // Get all content sections for a page
  async getPageContent(page: string): Promise<ContentSection[]> {
    const { data, error } = await supabase
      .from('content_sections')
      .select('*')
      .eq('page', page)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get specific content section by key
  async getContentByKey(sectionKey: string): Promise<ContentSection | null> {
    const { data, error } = await supabase
      .from('content_sections')
      .select('*')
      .eq('section_key', sectionKey)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  },

  // Get all content sections (admin only)
  async getAllContent(): Promise<ContentSection[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('content_sections')
      .select('*')
      .order('page', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Create content section
  async createContentSection(contentData: ContentSectionCreateData): Promise<ContentSection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('content_sections')
      .insert(contentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update content section
  async updateContentSection(id: string, updateData: ContentSectionUpdateData): Promise<ContentSection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('content_sections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete content section
  async deleteContentSection(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('content_sections')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Toggle content section active status
  async toggleContentActive(id: string): Promise<ContentSection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get current status
    const { data: current, error: fetchError } = await supabase
      .from('content_sections')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Toggle status
    const { data, error } = await supabase
      .from('content_sections')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

