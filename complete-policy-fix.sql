-- Complete fix for podcast episodes RLS
-- Run ALL of this in your Supabase SQL Editor at once

-- First, drop all existing policies for podcast_episodes
DROP POLICY IF EXISTS "Podcast episodes are viewable by authenticated users" ON podcast_episodes;
DROP POLICY IF EXISTS "Anyone can view podcast episodes" ON podcast_episodes;
DROP POLICY IF EXISTS "Service role can insert podcast episodes" ON podcast_episodes;
DROP POLICY IF EXISTS "Service role can update podcast episodes" ON podcast_episodes;

-- Disable RLS entirely for podcast_episodes (they should be public anyway)
ALTER TABLE podcast_episodes DISABLE ROW LEVEL SECURITY;

-- Verify no policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'podcast_episodes';