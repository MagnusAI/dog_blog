-- Initial Dog Kennel Database Schema Migration
-- Created: 2024-12-20
-- Description: Creates the core tables for a dog kennel management system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. breeds table
CREATE TABLE breeds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    fci_number VARCHAR(10),
    club_id VARCHAR(20),
    club_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. dogs table
CREATE TABLE dogs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100),
    gender VARCHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
    breed_id INTEGER NOT NULL,
    birth_date DATE,
    death_date DATE,
    is_deceased BOOLEAN DEFAULT FALSE,
    color VARCHAR(100),
    owner_person_id VARCHAR(50),
    original_dog_id VARCHAR(50), -- for tracking lineage changes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_dogs_breed FOREIGN KEY (breed_id) REFERENCES breeds(id)
);

-- 3. titles table
CREATE TABLE titles (
    id SERIAL PRIMARY KEY,
    dog_id VARCHAR(50) NOT NULL,
    title_code VARCHAR(50) NOT NULL,
    title_full_name VARCHAR(200),
    country_code VARCHAR(5),
    year_earned INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_titles_dog FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE
);

-- 4. pedigree_relationships table
CREATE TABLE pedigree_relationships (
    id SERIAL PRIMARY KEY,
    dog_id VARCHAR(50) NOT NULL,
    parent_id VARCHAR(50) NOT NULL,
    relationship_type VARCHAR(4) NOT NULL CHECK (relationship_type IN ('SIRE', 'DAM')),
    generation INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_pedigree_dog FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE,
    CONSTRAINT fk_pedigree_parent FOREIGN KEY (parent_id) REFERENCES dogs(id) ON DELETE CASCADE,
    CONSTRAINT unique_parent_relationship UNIQUE (dog_id, parent_id, relationship_type)
);

-- 5. my_dogs table (Your kennel's dogs)
CREATE TABLE my_dogs (
    id SERIAL PRIMARY KEY,
    dog_id VARCHAR(50) NOT NULL,
    acquisition_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_my_dogs_dog FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE,
    CONSTRAINT unique_my_dog UNIQUE (dog_id)
);

-- Create indexes for performance
CREATE INDEX idx_dogs_name ON dogs(name);
CREATE INDEX idx_dogs_breed ON dogs(breed_id);
CREATE INDEX idx_dogs_deceased ON dogs(is_deceased);
CREATE INDEX idx_dogs_birth_date ON dogs(birth_date);

CREATE INDEX idx_titles_dog ON titles(dog_id);
CREATE INDEX idx_titles_code ON titles(title_code);
CREATE INDEX idx_titles_year ON titles(year_earned);

CREATE INDEX idx_pedigree_dog ON pedigree_relationships(dog_id);
CREATE INDEX idx_pedigree_parent ON pedigree_relationships(parent_id);
CREATE INDEX idx_pedigree_type ON pedigree_relationships(relationship_type);
CREATE INDEX idx_pedigree_generation ON pedigree_relationships(generation);

CREATE INDEX idx_my_dogs_active ON my_dogs(is_active);
CREATE INDEX idx_my_dogs_acquisition ON my_dogs(acquisition_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_breeds_updated_at BEFORE UPDATE ON breeds 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dogs_updated_at BEFORE UPDATE ON dogs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_titles_updated_at BEFORE UPDATE ON titles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedigree_relationships_updated_at BEFORE UPDATE ON pedigree_relationships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_my_dogs_updated_at BEFORE UPDATE ON my_dogs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE breeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedigree_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE my_dogs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (you can modify these based on your needs)
-- For now, allowing all operations for authenticated users

-- Breeds policies
CREATE POLICY "Allow all operations on breeds for authenticated users" ON breeds
    FOR ALL USING (auth.role() = 'authenticated');

-- Dogs policies  
CREATE POLICY "Allow all operations on dogs for authenticated users" ON dogs
    FOR ALL USING (auth.role() = 'authenticated');

-- Titles policies
CREATE POLICY "Allow all operations on titles for authenticated users" ON titles
    FOR ALL USING (auth.role() = 'authenticated');

-- Pedigree relationships policies
CREATE POLICY "Allow all operations on pedigree_relationships for authenticated users" ON pedigree_relationships
    FOR ALL USING (auth.role() = 'authenticated');

-- My dogs policies
CREATE POLICY "Allow all operations on my_dogs for authenticated users" ON my_dogs
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert some common dog breeds as seed data
INSERT INTO breeds (name, fci_number, club_id, club_name) VALUES
    ('Norfolk Terrier', '272', 'FCI', 'Fédération Cynologique Internationale'),
    ('Jack Russell Terrier', '345', 'FCI', 'Fédération Cynologique Internationale');

-- Add comments to tables for documentation
COMMENT ON TABLE breeds IS 'Dog breeds with FCI registration information';
COMMENT ON TABLE dogs IS 'Individual dogs with basic information and lineage tracking';
COMMENT ON TABLE titles IS 'Awards and titles earned by dogs';
COMMENT ON TABLE pedigree_relationships IS 'Parent-child relationships for pedigree tracking';
COMMENT ON TABLE my_dogs IS 'Dogs belonging to your kennel';

-- Add column comments for key fields
COMMENT ON COLUMN dogs.gender IS 'M for Male, F for Female';
COMMENT ON COLUMN dogs.original_dog_id IS 'Used for tracking when dog records are migrated or updated';
COMMENT ON COLUMN pedigree_relationships.relationship_type IS 'SIRE for father, DAM for mother';
COMMENT ON COLUMN pedigree_relationships.generation IS 'Generation level: 1=parent, 2=grandparent, etc.';
COMMENT ON COLUMN titles.year_earned IS 'Year the title was earned';
