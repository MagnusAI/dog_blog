-- Add Dog Images Table Migration
-- Created: 2024-12-20
-- Description: Creates dog_images table for storing Cloudinary image data with multiple image types

-- Create dog_images table
CREATE TABLE dog_images (
    id SERIAL PRIMARY KEY,
    dog_id VARCHAR(50) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_public_id VARCHAR(255) NOT NULL,
    is_profile BOOLEAN DEFAULT FALSE,
    image_type VARCHAR(20) DEFAULT 'profile' CHECK (image_type IN ('profile', 'gallery', 'medical', 'pedigree')),
    alt_text VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint to dogs table
    CONSTRAINT fk_dog_images_dog FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_dog_images_dog_id ON dog_images(dog_id);
CREATE INDEX idx_dog_images_dog_profile ON dog_images(dog_id, is_profile);
CREATE INDEX idx_dog_images_type ON dog_images(image_type);
CREATE INDEX idx_dog_images_display_order ON dog_images(dog_id, display_order);

-- Create a function to ensure only one profile image per dog
CREATE OR REPLACE FUNCTION ensure_single_profile_image()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new/updated record is being set as profile image
    IF NEW.is_profile = TRUE THEN
        -- Set all other images for this dog to not be profile
        UPDATE dog_images 
        SET is_profile = FALSE, updated_at = NOW()
        WHERE dog_id = NEW.dog_id 
        AND is_profile = TRUE 
        AND (TG_OP = 'INSERT' OR id != NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain single profile image constraint
CREATE TRIGGER trigger_ensure_single_profile_image_insert
    BEFORE INSERT ON dog_images
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_profile_image();

CREATE TRIGGER trigger_ensure_single_profile_image_update
    BEFORE UPDATE ON dog_images
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_profile_image();

-- Create trigger function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_dog_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_dog_images_updated_at
    BEFORE UPDATE ON dog_images
    FOR EACH ROW
    EXECUTE FUNCTION update_dog_images_updated_at();

-- Enable Row Level Security
ALTER TABLE dog_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to match existing pattern
-- Anonymous users can read all images
CREATE POLICY "dog_images_read_policy" ON dog_images
    FOR SELECT
    USING (true);

-- Authenticated users can insert images
CREATE POLICY "dog_images_insert_policy" ON dog_images
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update images
CREATE POLICY "dog_images_update_policy" ON dog_images
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Authenticated users can delete images
CREATE POLICY "dog_images_delete_policy" ON dog_images
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Add some useful comments
COMMENT ON TABLE dog_images IS 'Stores image data for dogs with Cloudinary integration';
COMMENT ON COLUMN dog_images.image_url IS 'Full Cloudinary secure_url for the image';
COMMENT ON COLUMN dog_images.image_public_id IS 'Cloudinary public_id for transformations and deletions';
COMMENT ON COLUMN dog_images.is_profile IS 'Whether this is the primary profile image (only one per dog)';
COMMENT ON COLUMN dog_images.image_type IS 'Type of image: profile, gallery, medical, or pedigree';
COMMENT ON COLUMN dog_images.display_order IS 'Order for displaying images in galleries (lower numbers first)';

-- Example queries for reference (as comments):
/*
-- Get profile image for a specific dog
SELECT * FROM dog_images 
WHERE dog_id = 'DK10420/2025' AND is_profile = TRUE;

-- Get all images for a dog, profile first, then by display order
SELECT * FROM dog_images 
WHERE dog_id = 'DK10420/2025' 
ORDER BY is_profile DESC, display_order ASC, created_at ASC;

-- Get dogs with their profile images (JOIN query)
SELECT 
    d.*,
    di.image_url as profile_image_url,
    di.image_public_id as profile_image_public_id,
    di.alt_text as profile_alt_text
FROM dogs d
LEFT JOIN dog_images di ON d.id = di.dog_id AND di.is_profile = TRUE;

-- Set a new profile image (the trigger will handle making it the only profile)
UPDATE dog_images 
SET is_profile = TRUE 
WHERE id = <image_id>;

-- Add a new profile image (trigger will automatically unset others)
INSERT INTO dog_images (dog_id, image_url, image_public_id, is_profile, image_type, alt_text)
VALUES ('DK10420/2025', 'https://res.cloudinary.com/...', 'dog_images/xyz123', TRUE, 'profile', 'Photo of Batman the Norfolk Terrier');
*/
