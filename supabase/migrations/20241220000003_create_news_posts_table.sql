-- Create news_posts table
CREATE TABLE IF NOT EXISTS public.news_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(100) NOT NULL CHECK (char_length(title) >= 10),
    content TEXT NOT NULL CHECK (char_length(content) >= 50),
    image_url TEXT,
    image_alt VARCHAR(100),
    image_public_id VARCHAR(255), -- For Cloudinary optimization
    fallback_image_url TEXT,
    
    -- Publication info
    published_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Author info (links to auth.users)
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- SEO and metadata
    slug VARCHAR(200) UNIQUE, -- URL-friendly version of title
    meta_description VARCHAR(160), -- For SEO
    featured BOOLEAN DEFAULT FALSE, -- For highlighting posts
    
    -- Status
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_posts_published_date ON public.news_posts(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_status ON public.news_posts(status);
CREATE INDEX IF NOT EXISTS idx_news_posts_featured ON public.news_posts(featured);
CREATE INDEX IF NOT EXISTS idx_news_posts_slug ON public.news_posts(slug);
CREATE INDEX IF NOT EXISTS idx_news_posts_author ON public.news_posts(author_id);

-- Create news_posts_dogs junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.news_posts_dogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    news_post_id UUID NOT NULL REFERENCES public.news_posts(id) ON DELETE CASCADE,
    dog_id VARCHAR(50) NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure unique combinations
    UNIQUE(news_post_id, dog_id)
);

-- Create index for junction table
CREATE INDEX IF NOT EXISTS idx_news_posts_dogs_news_post ON public.news_posts_dogs(news_post_id);
CREATE INDEX IF NOT EXISTS idx_news_posts_dogs_dog ON public.news_posts_dogs(dog_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_news_posts_updated_at 
    BEFORE UPDATE ON public.news_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically generate slug from title
CREATE OR REPLACE FUNCTION generate_slug_from_title()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate slug if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(
            regexp_replace(
                regexp_replace(
                    regexp_replace(trim(NEW.title), '[^a-zA-Z0-9\s-]', '', 'g'),
                    '\s+', '-', 'g'
                ),
                '-+', '-', 'g'
            )
        );
        
        -- Ensure slug is unique by appending number if needed
        WHILE EXISTS (SELECT 1 FROM public.news_posts WHERE slug = NEW.slug AND id != COALESCE(NEW.id, gen_random_uuid())) LOOP
            NEW.slug := NEW.slug || '-' || extract(epoch from now())::integer;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically generate slug
CREATE TRIGGER generate_news_posts_slug 
    BEFORE INSERT OR UPDATE ON public.news_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION generate_slug_from_title();

-- Enable Row Level Security
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_posts_dogs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for news_posts

-- Everyone can read published news posts
CREATE POLICY "Anyone can view published news posts" ON public.news_posts
    FOR SELECT USING (status = 'published');

-- Authenticated users can view all their own posts (including drafts)
CREATE POLICY "Authors can view their own posts" ON public.news_posts
    FOR SELECT USING (auth.uid() = author_id);

-- Authenticated users can create news posts
CREATE POLICY "Authenticated users can create news posts" ON public.news_posts
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = author_id);

-- Authors can update their own posts
CREATE POLICY "Authors can update their own posts" ON public.news_posts
    FOR UPDATE 
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- Authors can delete their own posts
CREATE POLICY "Authors can delete their own posts" ON public.news_posts
    FOR DELETE 
    USING (auth.uid() = author_id);

-- RLS Policies for news_posts_dogs junction table

-- Everyone can read dog tags for published posts
CREATE POLICY "Anyone can view dog tags for published posts" ON public.news_posts_dogs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.news_posts np 
            WHERE np.id = news_post_id AND np.status = 'published'
        )
    );

-- Authors can view dog tags for their own posts
CREATE POLICY "Authors can view dog tags for their own posts" ON public.news_posts_dogs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.news_posts np 
            WHERE np.id = news_post_id AND np.author_id = auth.uid()
        )
    );

-- Authors can manage dog tags for their own posts
CREATE POLICY "Authors can manage dog tags for their own posts" ON public.news_posts_dogs
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.news_posts np 
            WHERE np.id = news_post_id AND np.author_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.news_posts np 
            WHERE np.id = news_post_id AND np.author_id = auth.uid()
        )
    );

-- Insert some sample news posts for demonstration
INSERT INTO public.news_posts (
    title,
    content,
    image_url,
    image_alt,
    published_date,
    featured,
    author_id
) VALUES 
(
    'Breaking: Historic Win at International Championship Sets New Standards',
    'In an unprecedented display of excellence, this year''s international championship has redefined what it means to achieve perfection in pedigree competitions. With over 500 participants from 30 countries, the event showcased the pinnacle of breeding excellence and training dedication that has shaped the future of canine sports.',
    'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&h=600&fit=crop&auto=format&q=80',
    'Championship dog show arena',
    '2025-01-20 10:00:00+00',
    true,
    auth.uid()
),
(
    'Annual Dog Show Championship Results',
    'The 2025 National Dog Show concluded with record-breaking attendance and fierce competition across all breeds. Golden Retrievers dominated the sporting group with exceptional performances.',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop&auto=format&q=80',
    'Dog championship event',
    '2025-01-15 14:30:00+00',
    false,
    auth.uid()
),
(
    'New Training Techniques for Better Pedigree Performance',
    'Discover the latest methodologies in canine training that are revolutionizing how we prepare dogs for competitions. Expert trainers share their insights on building stronger bonds between handlers and their champions.',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&auto=format&q=80',
    'Dog training session',
    '2025-01-10 09:15:00+00',
    false,
    auth.uid()
),
(
    'Health and Wellness: Maintaining Champion Bloodlines',
    'A comprehensive guide to ensuring the health and vitality of pedigreed dogs. From nutrition to genetic testing, learn how top breeders maintain the integrity of their bloodlines while promoting overall canine wellness and longevity.',
    'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=300&fit=crop&auto=format&q=80',
    'Veterinary care for dogs',
    '2025-01-05 16:45:00+00',
    false,
    auth.uid()
);

-- Add some sample dog tags (you'll need to replace with actual dog IDs from your dogs table)
-- Note: This will only work if you have dogs in your database
-- INSERT INTO public.news_posts_dogs (news_post_id, dog_id)
-- SELECT 
--     (SELECT id FROM public.news_posts WHERE title LIKE 'Breaking: Historic Win%' LIMIT 1),
--     (SELECT id FROM public.dogs LIMIT 1)
-- WHERE EXISTS (SELECT 1 FROM public.dogs LIMIT 1);
