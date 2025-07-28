-- Fix podcast episodes RLS policy to allow inserts
-- Run this in your Supabase SQL Editor

-- Drop the existing policy
DROP POLICY IF EXISTS "Podcast episodes are viewable by authenticated users" ON podcast_episodes;

-- Create new policies that allow both reading and inserting
CREATE POLICY "Anyone can view podcast episodes" ON podcast_episodes
FOR SELECT USING (true);

CREATE POLICY "Service role can insert podcast episodes" ON podcast_episodes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update podcast episodes" ON podcast_episodes
FOR UPDATE USING (true);