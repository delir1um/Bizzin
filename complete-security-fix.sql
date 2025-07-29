-- Complete Supabase Security Fix for Bizzin Platform
-- This addresses all RLS policy gaps and security warnings

-- 1. Fix podcast_episodes table policies (missing INSERT/UPDATE for admin operations)
DROP POLICY IF EXISTS "Podcast episodes are viewable by authenticated users" ON podcast_episodes;
DROP POLICY IF EXISTS "Admin can manage podcast episodes" ON podcast_episodes;

-- Allow all authenticated users to read episodes
CREATE POLICY "podcast_episodes_select" ON podcast_episodes
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to manage episodes (for admin operations)
CREATE POLICY "podcast_episodes_admin" ON podcast_episodes
FOR ALL USING (auth.role() = 'service_role');

-- 2. Fix missing RLS policies for other tables that may have been created

-- Ensure journal_entries has proper RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can manage their own journal entries" ON journal_entries;

CREATE POLICY "journal_entries_select" ON journal_entries
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "journal_entries_insert" ON journal_entries
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "journal_entries_update" ON journal_entries
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "journal_entries_delete" ON journal_entries
FOR DELETE USING (auth.uid() = user_id);

-- 3. Fix goals table RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own goals" ON goals;

CREATE POLICY "goals_select" ON goals
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "goals_insert" ON goals
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_update" ON goals
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "goals_delete" ON goals
FOR DELETE USING (auth.uid() = user_id);

-- 4. Fix documents table RLS (DocSafe)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own documents" ON documents;

CREATE POLICY "documents_select" ON documents
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "documents_insert" ON documents
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_update" ON documents
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "documents_delete" ON documents
FOR DELETE USING (auth.uid() = user_id);

-- 5. Fix user_plans table RLS
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own plans" ON user_plans;

CREATE POLICY "user_plans_select" ON user_plans
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_plans_insert" ON user_plans
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_plans_update" ON user_plans
FOR UPDATE USING (auth.uid() = user_id);

-- 6. Fix usage_limits table RLS
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own usage limits" ON usage_limits;

CREATE POLICY "usage_limits_select" ON usage_limits
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "usage_limits_insert" ON usage_limits
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usage_limits_update" ON usage_limits
FOR UPDATE USING (auth.uid() = user_id);

-- 7. Fix profiles table RLS (user profiles)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own profiles" ON profiles;

CREATE POLICY "profiles_select" ON profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert" ON profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update" ON profiles
FOR UPDATE USING (auth.uid() = user_id);

-- 8. Create comprehensive security function for admin operations
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Update podcast episodes policy to allow admin inserts
DROP POLICY IF EXISTS "podcast_episodes_admin" ON podcast_episodes;

CREATE POLICY "podcast_episodes_admin_insert" ON podcast_episodes
FOR INSERT WITH CHECK (auth.is_admin());

CREATE POLICY "podcast_episodes_admin_update" ON podcast_episodes
FOR UPDATE USING (auth.is_admin());

CREATE POLICY "podcast_episodes_admin_delete" ON podcast_episodes
FOR DELETE USING (auth.is_admin());

-- 10. Ensure all tables have proper indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_id ON usage_limits(user_id);
-- Index for user_profiles if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
    END IF;
END $$;

-- Verify all tables have RLS enabled
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('journal_entries', 'goals', 'documents', 'user_plans', 'usage_limits', 'user_profiles', 'podcast_episodes', 'user_podcast_progress', 'user_podcast_stats')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'Enabled RLS for table: %', r.tablename;
    END LOOP;
END $$;