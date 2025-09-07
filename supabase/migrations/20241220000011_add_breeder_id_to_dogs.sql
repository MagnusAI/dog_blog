-- Add breeder_id column to dogs table
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS breeder_id VARCHAR(50);

-- Add foreign key constraint to persons table (optional, for referential integrity)
-- Note: This assumes the persons table exists and has the id column
-- ALTER TABLE dogs ADD CONSTRAINT fk_dogs_breeder 
--   FOREIGN KEY (breeder_id) REFERENCES persons(id);

-- Add index for efficient queries on breeder_id
CREATE INDEX IF NOT EXISTS idx_dogs_breeder_id ON dogs(breeder_id);

-- Add comment for documentation
COMMENT ON COLUMN dogs.breeder_id IS 'Reference to the breeder person/entity ID in the persons table';
