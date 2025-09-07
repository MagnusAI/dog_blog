-- Enable pg_trgm extension for fuzzy text searching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create persons table for mapping IDs to names (owners, breeders, etc.)
CREATE TABLE IF NOT EXISTS persons (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'unknown', -- 'owner', 'breeder', 'unknown', etc.
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient searching
CREATE INDEX IF NOT EXISTS idx_persons_name ON persons(name);
CREATE INDEX IF NOT EXISTS idx_persons_type ON persons(type);
CREATE INDEX IF NOT EXISTS idx_persons_active ON persons(is_active);
CREATE INDEX IF NOT EXISTS idx_persons_name_trgm ON persons USING gin(name gin_trgm_ops);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_persons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_persons_updated_at
  BEFORE UPDATE ON persons
  FOR EACH ROW
  EXECUTE FUNCTION update_persons_updated_at();

-- Enable RLS
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Create policies for persons table
-- Anonymous users can read active persons
CREATE POLICY "Anonymous users can read active persons" ON persons
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Authenticated users can read all persons
CREATE POLICY "Authenticated users can read all persons" ON persons
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert persons
CREATE POLICY "Authenticated users can insert persons" ON persons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update persons
CREATE POLICY "Authenticated users can update persons" ON persons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete persons
CREATE POLICY "Authenticated users can delete persons" ON persons
  FOR DELETE
  TO authenticated
  USING (true);

-- Add comments for documentation
COMMENT ON TABLE persons IS 'Mapping table for person/entity IDs to names (owners, breeders, etc.)';
COMMENT ON COLUMN persons.id IS 'Unique identifier for the person/entity';
COMMENT ON COLUMN persons.name IS 'Display name for the person/entity';
COMMENT ON COLUMN persons.type IS 'Type of person/entity (owner, breeder, unknown, etc.)';
COMMENT ON COLUMN persons.notes IS 'Additional notes about the person/entity';
COMMENT ON COLUMN persons.is_active IS 'Whether this person/entity is currently active';
