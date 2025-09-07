-- Add path column to pedigree_relationships table
-- Created: 2024-12-20
-- Description: Adds path column to store binary tree navigation paths (sti values)

-- Add the path column to store the binary tree path
ALTER TABLE pedigree_relationships 
ADD COLUMN path VARCHAR(10);

-- Add a comment explaining what the path column stores
COMMENT ON COLUMN pedigree_relationships.path 
IS 'Binary tree path where 0=father, 1=mother at each level (e.g., "01" = father''s mother)';

-- Update the existing unique constraint to include the path column
-- This ensures we don't have duplicate entries for the same exact path
ALTER TABLE pedigree_relationships 
DROP CONSTRAINT IF EXISTS unique_parent_relationship_generation;

ALTER TABLE pedigree_relationships 
ADD CONSTRAINT unique_parent_relationship_path 
UNIQUE (dog_id, parent_id, relationship_type, generation, path);

-- Add index on path column for better query performance
CREATE INDEX idx_pedigree_path ON pedigree_relationships(path);

-- Add a check constraint to ensure path contains only 0s and 1s
ALTER TABLE pedigree_relationships
ADD CONSTRAINT path_binary_format 
CHECK (path IS NULL OR path ~ '^[01]*$');

-- Add a check constraint to ensure path length matches generation
-- (path length should equal generation number)
ALTER TABLE pedigree_relationships
ADD CONSTRAINT path_generation_match
CHECK (path IS NULL OR LENGTH(path) = generation);

-- Update the comment on the constraint
COMMENT ON CONSTRAINT unique_parent_relationship_path ON pedigree_relationships 
IS 'Prevents duplicate relationships by ensuring unique combination of dog, parent, type, generation, and path';

COMMENT ON CONSTRAINT path_binary_format ON pedigree_relationships 
IS 'Ensures path contains only binary digits (0 and 1)';

COMMENT ON CONSTRAINT path_generation_match ON pedigree_relationships 
IS 'Ensures path length matches generation level (e.g., generation 2 should have path of length 2)';