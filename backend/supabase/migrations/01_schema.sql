-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    role TEXT DEFAULT 'reader' NOT NULL, -- 'reader' or 'editor'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Articles table
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT UNIQUE NOT NULL,
    title TEXT,
    author TEXT,
    body_text TEXT,
    category TEXT,
    status TEXT DEFAULT 'processing' NOT NULL, -- 'processing', 'completed', 'failed'
    editor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Article semantic chunks (for RAG context)
CREATE TABLE IF NOT EXISTS public.article_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    chunk_index INTEGER NOT NULL,
    content_text TEXT NOT NULL,
    embedding VECTOR(384) -- HuggingFace sentence-transformers/all-MiniLM-L6-v2 dimensions
);

-- Swipe cards generated for each article
CREATE TABLE IF NOT EXISTS public.swipe_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    card_index INTEGER NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Chat sessions for RAG history
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Chat messages inside sessions
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
    sender TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Analytics logs for tracking swipes and reading events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'view', 'read', 'swipe_up', 'dwell_time'
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create HNSW index for vector cosine similarity search
CREATE INDEX IF NOT EXISTS article_chunks_embedding_idx 
ON public.article_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Similarity matching function for pgvector search
CREATE OR REPLACE FUNCTION public.match_chunks (
  query_embedding VECTOR(384),
  match_threshold FLOAT,
  match_count INTEGER
)
RETURNS TABLE (
  id UUID,
  article_id UUID,
  chunk_index INTEGER,
  content_text TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    article_chunks.id,
    article_chunks.article_id,
    article_chunks.chunk_index,
    article_chunks.content_text,
    1 - (article_chunks.embedding <=> query_embedding) AS similarity
  FROM article_chunks
  WHERE 1 - (article_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY article_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
