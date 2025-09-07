-- Fix path column constraint for upsert compatibility
-- Created: 2024-12-20
-- Description: Updates the unique constraint to work with Supabase upsert operations

-- Drop the current constraint that includes path
ALTER TABLE pedigree_relationships 
DROP CONSTRAINT IF EXISTS unique_parent_relationship_path;

-- Create a new constraint that matches what the upsert expects
-- This allows the same parent to appear in different generations/paths
-- but prevents true duplicates (same dog, parent, type, generation, and path)
ALTER TABLE pedigree_relationships 
ADD CONSTRAINT unique_pedigree_relationship 
UNIQUE (dog_id, parent_id, relationship_type, generation, path);

-- Update the comment
COMMENT ON CONSTRAINT unique_pedigree_relationship ON pedigree_relationships 
IS 'Ensures unique pedigree relationships including path for proper upsert handling';