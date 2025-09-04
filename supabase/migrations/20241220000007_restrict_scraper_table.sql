-- Migration: Secure existing scraper_sessions table
-- This migration applies security policies to protect session data

BEGIN;

-- Enable Row Level Security on existing table
ALTER TABLE scraper_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "No public access" ON scraper_sessions;
DROP POLICY IF EXISTS "Service role full access" ON scraper_sessions;
DROP POLICY IF EXISTS "Authenticated users no access" ON scraper_sessions;

-- Policy 1: Completely block public access (anon role)
CREATE POLICY "No public access" ON scraper_sessions
  FOR ALL 
  TO anon
  USING (false)
  WITH CHECK (false);

-- Policy 2: Block authenticated users (authenticated role)
CREATE POLICY "Authenticated users no access" ON scraper_sessions
  FOR ALL 
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Policy 3: Only service_role (your Edge Functions) can access
CREATE POLICY "Service role full access" ON scraper_sessions
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Revoke all default permissions
REVOKE ALL ON scraper_sessions FROM anon;
REVOKE ALL ON scraper_sessions FROM authenticated;
REVOKE ALL ON scraper_sessions FROM public;

-- Grant permissions only to service_role
GRANT ALL ON scraper_sessions TO service_role;

-- Create cleanup function for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_scraper_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete sessions that expired more than 1 hour ago
  DELETE FROM scraper_sessions 
  WHERE expires_at < (NOW() - INTERVAL '1 hour');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Also mark sessions as inactive if they're past expiry
  UPDATE scraper_sessions 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
  
  RETURN deleted_count;
END;
$$;

-- Secure the cleanup function
REVOKE ALL ON FUNCTION cleanup_expired_scraper_sessions() FROM public;
GRANT EXECUTE ON FUNCTION cleanup_expired_scraper_sessions() TO service_role;

COMMIT;

-- Verification: Check that RLS is enabled and policies exist
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'scraper_sessions';

SELECT 
  tablename, 
  policyname, 
  roles, 
  cmd as command
FROM pg_policies 
WHERE tablename = 'scraper_sessions'
ORDER BY policyname;