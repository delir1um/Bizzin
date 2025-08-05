-- Complete Database Setup for Bizzin Platform
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Create utility functions for SQL execution
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

-- Step 2: Clean up problematic admin_users policies
DROP POLICY IF EXISTS "Users can view own admin status" ON admin_users;
DROP POLICY IF EXISTS "Users can update own admin status" ON admin_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON admin_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON admin_users;

-- Disable and re-enable RLS for admin_users to reset
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for admin_users
CREATE POLICY "admin_users_select_policy" ON admin_users FOR SELECT USING (true);
CREATE POLICY "admin_users_insert_policy" ON admin_users FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_users_update_policy" ON admin_users FOR UPDATE USING (true);

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

CREATE POLICY "user_profiles_select_policy" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "user_profiles_insert_policy" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "user_profiles_update_policy" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 4: Create/verify user_plans table
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  plan_status VARCHAR(20) DEFAULT 'active' CHECK (plan_status IN ('active', 'cancelled', 'expired')),
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  amount_paid DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'ZAR',
  paystack_customer_code TEXT,
  paystack_subscription_code TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "user_plans_user_policy" ON user_plans FOR ALL USING (auth.uid() = user_id);

-- Step 5: Create/verify usage_limits table
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL,
  documents_uploaded INTEGER DEFAULT 0,
  journal_entries_created INTEGER DEFAULT 0,
  goals_created INTEGER DEFAULT 0,
  calculator_uses JSONB DEFAULT '{}',
  storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, month_year)
);

ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "usage_limits_user_policy" ON usage_limits FOR ALL USING (auth.uid() = user_id);

-- Step 6: Create/verify journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  mood TEXT,
  energy_level TEXT,
  tags TEXT[],
  ai_sentiment_score DECIMAL(3,2),
  ai_categories TEXT[],
  ai_insights TEXT,
  reflection TEXT,
  entry_date DATE NOT NULL,
  sentiment_data JSONB,
  related_goal_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "journal_entries_user_policy" ON journal_entries FOR ALL USING (auth.uid() = user_id);

-- Add index for journal sentiment data
CREATE INDEX IF NOT EXISTS idx_journal_entries_sentiment_data ON journal_entries USING GIN (sentiment_data);

-- Step 7: Create/verify goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  target_value DECIMAL(15,2),
  current_value DECIMAL(15,2) DEFAULT 0,
  unit TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "goals_user_policy" ON goals FOR ALL USING (auth.uid() = user_id);

-- Add foreign key for journal-goal linking if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'journal_entries' AND column_name = 'related_goal_id'
  ) THEN
    ALTER TABLE journal_entries ADD COLUMN related_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for goal linking
CREATE INDEX IF NOT EXISTS idx_journal_entries_related_goal_id ON journal_entries(related_goal_id);

-- Step 8: Create/verify documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  category TEXT,
  tags TEXT[],
  description TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "documents_user_policy" ON documents FOR ALL USING (auth.uid() = user_id);

-- Step 9: Create/verify podcast tables
CREATE TABLE IF NOT EXISTS podcast_episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  series TEXT NOT NULL,
  episode_number INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  has_video BOOLEAN DEFAULT FALSE,
  video_url TEXT,
  audio_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "podcast_episodes_select_policy" ON podcast_episodes FOR SELECT USING (true);

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
CREATE POLICY IF NOT EXISTS "podcast_progress_user_policy" ON podcast_progress FOR ALL USING (auth.uid() = user_id);

-- Step 10: Grant necessary permissions
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;

-- Step 11: Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (user_id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  
  INSERT INTO user_plans (user_id, plan_type, plan_status, created_at, updated_at)
  VALUES (NEW.id, 'free', 'active', NOW(), NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 12: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_plans_updated_at BEFORE UPDATE ON user_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_limits_updated_at BEFORE UPDATE ON usage_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_podcast_episodes_updated_at BEFORE UPDATE ON podcast_episodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_podcast_progress_updated_at BEFORE UPDATE ON podcast_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Completed! Your database is now fully set up.