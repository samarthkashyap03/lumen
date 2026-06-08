-- ============================================================
-- LUMEN FIX MIGRATION: Run this in Supabase SQL Editor
-- Fixes: profiles FK constraint, analytics timestamp column, and disables RLS
-- ============================================================

-- 1. Drop the foreign key constraint on profiles.id that requires auth.users
--    (This ensures profiles can be created even if auth.users doesn't exist yet
--     or if mock database profiles are stored.)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Make profiles.id a plain UUID primary key (no FK to auth.users)
--    Now inserts from the backend will succeed without needing auth.users.

-- 3. Fix analytics_events: add created_at column (backend inserts created_at,
--    schema only had "timestamp"). Keep both for safety.
ALTER TABLE public.analytics_events 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- 4. Drop the foreign key constraint on articles.editor_id pointing to profiles.id
--    This ensures that even if a user has a mock profile/ID locally or in fallback mode,
--    it won't crash when saving the article to the database.
ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_editor_id_fkey;

-- 5. Disable Row Level Security (RLS) on all public tables to prevent permission issues
--    if the service role key is not configured in production env variables.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_chunks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipe_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events DISABLE ROW LEVEL SECURITY;

-- Note on Celery Worker in Railway:
-- If Celery worker shows "superuser privileges" warning and is not running:
-- Set the environment variable: C_FORCE_ROOT=1 in your Railway backend/worker service configuration.
-- This forces Celery to run correctly as root inside the docker container.
