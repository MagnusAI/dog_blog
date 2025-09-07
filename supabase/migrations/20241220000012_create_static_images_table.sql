-- Create static_images table for storing images for various static pages
CREATE TABLE static_images (
  id SERIAL PRIMARY KEY,
  page_type VARCHAR(50) NOT NULL, -- e.g., 'contact', 'about', 'home'
  section_id VARCHAR(50) NOT NULL, -- e.g., 'profile', 'facility', 'outdoor', 'indoor'
  image_url TEXT NOT NULL,
  image_public_id VARCHAR(255) NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(page_type, section_id) -- Ensure one image per section per page
);

-- Create indexes for faster lookups
CREATE INDEX idx_static_images_page_type ON static_images(page_type);
CREATE INDEX idx_static_images_section_id ON static_images(section_id);
CREATE INDEX idx_static_images_page_section ON static_images(page_type, section_id);

-- Add RLS policies
ALTER TABLE static_images ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read static images
CREATE POLICY "Allow anonymous read access to static images" ON static_images
  FOR SELECT USING (true);

-- Allow authenticated users to manage static images
CREATE POLICY "Allow authenticated users to manage static images" ON static_images
  FOR ALL USING (auth.role() = 'authenticated');

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_static_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_static_images_updated_at
  BEFORE UPDATE ON static_images
  FOR EACH ROW
  EXECUTE FUNCTION update_static_images_updated_at();
