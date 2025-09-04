CREATE TABLE scraper_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  cookies TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  login_method TEXT CHECK (login_method IN ('CAS', 'STANDARD'))
);

-- Index for performance
CREATE INDEX idx_scraper_sessions_active_expires ON scraper_sessions(is_active, expires_at);
CREATE INDEX idx_scraper_sessions_session_id ON scraper_sessions(session_id);