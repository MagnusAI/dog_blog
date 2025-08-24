-- Anonymous read-only, authenticated write access for all tables

-- BREEDS TABLE
DROP POLICY IF EXISTS "Allow all operations on breeds for authenticated users" ON breeds;
CREATE POLICY "breeds_read_policy" ON breeds
    FOR SELECT USING (true);
CREATE POLICY "breeds_insert_policy" ON breeds
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "breeds_update_policy" ON breeds
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "breeds_delete_policy" ON breeds
    FOR DELETE USING (auth.role() = 'authenticated');

-- DOGS TABLE  
DROP POLICY IF EXISTS "Allow all operations on dogs for authenticated users" ON dogs;
CREATE POLICY "dogs_read_policy" ON dogs
    FOR SELECT USING (true);
CREATE POLICY "dogs_insert_policy" ON dogs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "dogs_update_policy" ON dogs
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "dogs_delete_policy" ON dogs
    FOR DELETE USING (auth.role() = 'authenticated');

-- TITLES TABLE
DROP POLICY IF EXISTS "Allow all operations on titles for authenticated users" ON titles;
CREATE POLICY "titles_read_policy" ON titles
    FOR SELECT USING (true);
CREATE POLICY "titles_insert_policy" ON titles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "titles_update_policy" ON titles
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "titles_delete_policy" ON titles
    FOR DELETE USING (auth.role() = 'authenticated');

-- PEDIGREE_RELATIONSHIPS TABLE
DROP POLICY IF EXISTS "Allow all operations on pedigree_relationships for authenticated users" ON pedigree_relationships;
CREATE POLICY "pedigree_read_policy" ON pedigree_relationships
    FOR SELECT USING (true);
CREATE POLICY "pedigree_insert_policy" ON pedigree_relationships
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "pedigree_update_policy" ON pedigree_relationships
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "pedigree_delete_policy" ON pedigree_relationships
    FOR DELETE USING (auth.role() = 'authenticated');

-- MY_DOGS TABLE
DROP POLICY IF EXISTS "Allow all operations on my_dogs for authenticated users" ON my_dogs;
CREATE POLICY "my_dogs_read_policy" ON my_dogs
    FOR SELECT USING (true);
CREATE POLICY "my_dogs_insert_policy" ON my_dogs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "my_dogs_update_policy" ON my_dogs
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "my_dogs_delete_policy" ON my_dogs
    FOR DELETE USING (auth.role() = 'authenticated');
