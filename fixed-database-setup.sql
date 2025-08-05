-- Fixed Database Setup for Bizzin Platform
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Create utility function for SQL execution
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_count integer;
BEGIN
  EXECUTE sql_query;
  GET DIAGNOSTICS result_count = ROW_COUNT;
  RETURN json_build_object('success', true, 'rows_affected', result_count);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;

-- Step 2: Clean up problematic admin_users policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view own admin status" ON admin_users;
  DROP POLICY IF EXISTS "Users can update own admin status" ON admin_users;
  DROP POLICY IF EXISTS "Enable read access for all users" ON admin_users;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON admin_users;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- Reset RLS for admin_users
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for admin_users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'admin_users_select_policy') THEN
    CREATE POLICY "admin_users_select_policy" ON admin_users FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'admin_users_insert_policy') THEN
    CREATE POLICY "admin_users_insert_policy" ON admin_users FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'admin_users_update_policy') THEN
    CREATE POLICY "admin_users_update_policy" ON admin_users FOR UPDATE USING (true);
  END IF;
END $$;

-- Step 3: Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  business_name TEXT,
  business_type TEXT,
  business_size TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS and create policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_select_policy') THEN
    CREATE POLICY "user_profiles_select_policy" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_insert_policy') THEN
    CREATE POLICY "user_profiles_insert_policy" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_update_policy') THEN
    CREATE POLICY "user_profiles_update_policy" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Step 4: Fix user_plans policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_plans' AND policyname = 'user_plans_user_policy') THEN
    CREATE POLICY "user_plans_user_policy" ON user_plans FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Step 5: Fix usage_limits policies  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_limits' AND policyname = 'usage_limits_user_policy') THEN
    CREATE POLICY "usage_limits_user_policy" ON usage_limits FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Step 6: Fix journal_entries policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'journal_entries_user_policy') THEN
    CREATE POLICY "journal_entries_user_policy" ON journal_entries FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Step 7: Fix goals policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'goals_user_policy') THEN
    CREATE POLICY "goals_user_policy" ON goals FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Step 8: Fix documents policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'documents_user_policy') THEN
    CREATE POLICY "documents_user_policy" ON documents FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Step 9: Create missing podcast_progress table
CREATE TABLE IF NOT EXISTS podcast_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES podcast_episodes(id) ON DELETE CASCADE,
  progress_seconds INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, episode_id)
);

ALTER TABLE podcast_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'podcast_progress' AND policyname = 'podcast_progress_user_policy') THEN
    CREATE POLICY "podcast_progress_user_policy" ON podcast_progress FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Step 10: Fix podcast_episodes policies (make readable by all authenticated users)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'podcast_episodes' AND policyname = 'podcast_episodes_select_policy') THEN
    CREATE POLICY "podcast_episodes_select_policy" ON podcast_episodes FOR SELECT USING (true);
  END IF;
END $$;

-- Step 11: Add journal-goal linking column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'journal_entries' AND column_name = 'related_goal_id'
  ) THEN
    ALTER TABLE journal_entries ADD COLUMN related_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add sentiment_data column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'journal_entries' AND column_name = 'sentiment_data'
  ) THEN
    ALTER TABLE journal_entries ADD COLUMN sentiment_data JSONB;
  END IF;
END $$;

-- Step 12: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_sentiment_data ON journal_entries USING GIN (sentiment_data);
CREATE INDEX IF NOT EXISTS idx_journal_entries_related_goal_id ON journal_entries(related_goal_id);
CREATE INDEX IF NOT EXISTS idx_podcast_progress_user_episode ON podcast_progress(user_id, episode_id);

-- Step 13: Create function to handle new user signups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (user_id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  
  INSERT INTO user_plans (user_id, plan_type, plan_status, created_at, updated_at)
  VALUES (NEW.id, 'free', 'active', NOW(), NOW());
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup (replace if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 14: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_plans_updated_at ON user_plans;
CREATE TRIGGER update_user_plans_updated_at BEFORE UPDATE ON user_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_limits_updated_at ON usage_limits;
CREATE TRIGGER update_usage_limits_updated_at BEFORE UPDATE ON usage_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_podcast_episodes_updated_at ON podcast_episodes;
CREATE TRIGGER update_podcast_episodes_updated_at BEFORE UPDATE ON podcast_episodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_podcast_progress_updated_at ON podcast_progress;
CREATE TRIGGER update_podcast_progress_updated_at BEFORE UPDATE ON podcast_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Database setup completed successfully!