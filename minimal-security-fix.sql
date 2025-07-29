-- Minimal Supabase Security Fix - No Auth Schema Permissions Required
-- This fixes the most critical RLS issues without requiring elevated permissions

-- 1. Fix podcast_episodes table policies
DROP POLICY IF EXISTS "Podcast episodes are viewable by authenticated users" ON podcast_episodes;
DROP POLICY IF EXISTS "Admin can manage podcast episodes" ON podcast_episodes;
DROP POLICY IF EXISTS "podcast_episodes_select" ON podcast_episodes;
DROP POLICY IF EXISTS "podcast_episodes_admin" ON podcast_episodes;

-- Allow authenticated users to read episodes
CREATE POLICY "podcast_episodes_read" ON podcast_episodes
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role full access for admin operations
CREATE POLICY "podcast_episodes_service_all" ON podcast_episodes
FOR ALL USING (auth.role() = 'service_role');

-- 2. Ensure podcast progress tables have proper RLS
ALTER TABLE user_podcast_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_podcast_stats ENABLE ROW LEVEL SECURITY;

-- Fix user_podcast_progress policies
DROP POLICY IF EXISTS "Users can view own podcast progress" ON user_podcast_progress;
DROP POLICY IF EXISTS "Users can insert own podcast progress" ON user_podcast_progress;
DROP POLICY IF EXISTS "Users can update own podcast progress" ON user_podcast_progress;

CREATE POLICY "user_podcast_progress_own" ON user_podcast_progress
FOR ALL USING (auth.uid() = user_id);

-- Fix user_podcast_stats policies  
DROP POLICY IF EXISTS "Users can view own podcast stats" ON user_podcast_stats;
DROP POLICY IF EXISTS "Users can insert own podcast stats" ON user_podcast_stats;
DROP POLICY IF EXISTS "Users can update own podcast stats" ON user_podcast_stats;

CREATE POLICY "user_podcast_stats_own" ON user_podcast_stats
FOR ALL USING (auth.uid() = user_id);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_podcast_progress_user_id ON user_podcast_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_podcast_progress_episode_id ON user_podcast_progress(episode_id);
CREATE INDEX IF NOT EXISTS idx_user_podcast_stats_user_id ON user_podcast_stats(user_id);

-- Success message
SELECT 'Minimal security fix completed successfully!' AS result;