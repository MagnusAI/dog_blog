-- Fix Pedigree Relationships Unique Constraint
-- Created: 2024-12-20
-- Description: Allows the same ancestor to appear multiple times for the same dog in different generations

-- Drop the existing constraint that prevents duplicate ancestors
ALTER TABLE pedigree_relationships 
DROP CONSTRAINT IF EXISTS unique_parent_relationship;

-- Add a new constraint that allows the same ancestor in different generations
-- but prevents exact duplicates (same dog, parent, relationship_type, AND generation)
ALTER TABLE pedigree_relationships 
ADD CONSTRAINT unique_parent_relationship_generation 
UNIQUE (dog_id, parent_id, relationship_type, generation);

-- Add a comment explaining the change
COMMENT ON CONSTRAINT unique_parent_relationship_generation ON pedigree_relationships 
IS 'Allows same ancestor to appear multiple times for same dog in different generations (e.g., grandfather and great-grandfather)';
