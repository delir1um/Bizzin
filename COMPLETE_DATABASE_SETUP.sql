-- Complete Database Setup for Bizzin Admin Dashboard
-- Run this in your Supabase SQL editor

-- 1. Create user_profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email varchar(255) NOT NULL,
  first_name varchar(100),
  last_name varchar(100),
  full_name varchar(200),
  business_name varchar(200),
  business_type varchar(100),
  business_size varchar(50),
  phone varchar(20),
  bio text,
  avatar_url text,
  is_admin boolean DEFAULT false,
  is_active boolean DEFAULT true,
  last_login timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Create user_plans table for subscription management
CREATE TABLE IF NOT EXISTS user_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type varchar(50) NOT NULL DEFAULT 'free', -- 'free' or 'premium'
  plan_status varchar(50) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  billing_cycle varchar(20) DEFAULT 'monthly', -- 'monthly', 'yearly'
  amount_paid decimal(10,2) DEFAULT 0,
  currency varchar(3) DEFAULT 'ZAR',
  paystack_customer_code varchar(100),
  paystack_subscription_code varchar(100),
  started_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- 3. Create early_signups table for pre-launch leads
CREATE TABLE IF NOT EXISTS early_signups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  first_name varchar(100) NOT NULL,
  business_name varchar(200) NOT NULL,
  business_type varchar(100) NOT NULL,
  business_size varchar(50) NOT NULL,
  signup_date timestamp with time zone DEFAULT now() NOT NULL,
  source varchar(100) DEFAULT 'pre_launch_landing',
  is_notified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title varchar(255) NOT NULL,
  content text NOT NULL,
  category varchar(100),
  mood varchar(100),
  energy_level varchar(20),
  tags text[],
  ai_sentiment_score decimal(3,2),
  ai_categories text[],
  ai_insights text,
  reflection text,
  entry_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 5. Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  category varchar(100),
  target_value decimal(15,2),
  current_value decimal(15,2) DEFAULT 0,
  unit varchar(50),
  priority varchar(20) DEFAULT 'medium',
  status varchar(20) DEFAULT 'active',
  due_date date,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 6. Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name varchar(255) NOT NULL,
  original_name varchar(255) NOT NULL,
  file_path text NOT NULL,
  file_type varchar(100) NOT NULL,
  file_size bigint NOT NULL,
  category varchar(100),
  tags text[],
  description text,
  is_shared boolean DEFAULT false,
  shared_with uuid[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 7. Create podcast_episodes table
CREATE TABLE IF NOT EXISTS podcast_episodes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title varchar(255) NOT NULL,
  description text,
  series varchar(100) NOT NULL,
  episode_number integer NOT NULL,
  duration integer NOT NULL, -- in seconds
  has_video boolean DEFAULT false,
  video_url text,
  audio_url text,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 8. Create podcast_progress table
CREATE TABLE IF NOT EXISTS podcast_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  episode_id uuid REFERENCES podcast_episodes(id) ON DELETE CASCADE NOT NULL,
  progress_seconds integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, episode_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON user_profiles(last_login);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_status ON user_plans(plan_status);
CREATE INDEX IF NOT EXISTS idx_early_signups_email ON early_signups(email);
CREATE INDEX IF NOT EXISTS idx_early_signups_date ON early_signups(signup_date);
CREATE INDEX IF NOT EXISTS idx_early_signups_business_type ON early_signups(business_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_podcast_progress_user_id ON podcast_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_published ON podcast_episodes(is_published);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE early_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- RLS Policies for user_plans
CREATE POLICY "Users can view own plan" ON user_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own plan" ON user_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plan" ON user_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all plans" ON user_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- RLS Policies for early_signups
CREATE POLICY "Allow public signup insertion" ON early_signups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all signups" ON early_signups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can update signups" ON early_signups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- RLS Policies for journal_entries
CREATE POLICY "Users can manage own journal entries" ON journal_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all journal entries" ON journal_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- RLS Policies for goals
CREATE POLICY "Users can manage own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all goals" ON goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- RLS Policies for documents
CREATE POLICY "Users can manage own documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- RLS Policies for podcast_episodes
CREATE POLICY "Anyone can view published episodes" ON podcast_episodes
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all episodes" ON podcast_episodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- RLS Policies for podcast_progress
CREATE POLICY "Users can manage own progress" ON podcast_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON podcast_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- Create trigger function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, first_name, last_name, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'full_name'
  );
  
  -- Create default free plan
  INSERT INTO public.user_plans (user_id, plan_type, plan_status)
  VALUES (new.id, 'free', 'active');
  
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create trigger to run the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR each ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER set_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();
CREATE TRIGGER set_user_plans_updated_at BEFORE UPDATE ON user_plans FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();
CREATE TRIGGER set_early_signups_updated_at BEFORE UPDATE ON early_signups FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();
CREATE TRIGGER set_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();
CREATE TRIGGER set_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();
CREATE TRIGGER set_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();
CREATE TRIGGER set_podcast_episodes_updated_at BEFORE UPDATE ON podcast_episodes FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();
CREATE TRIGGER set_podcast_progress_updated_at BEFORE UPDATE ON podcast_progress FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();

-- Insert some sample podcast episodes for testing
INSERT INTO podcast_episodes (title, description, series, episode_number, duration, audio_url, is_published)
VALUES
  ('Strategic Planning Fundamentals', 'Learn the basics of strategic planning for your business', 'Strategy', 1, 900, 'https://example.com/audio1.mp3', true),
  ('Market Research Techniques', 'Effective methods for understanding your market', 'Research', 1, 1080, 'https://example.com/audio2.mp3', true),
  ('Financial Planning 101', 'Essential financial planning for entrepreneurs', 'Finance', 1, 960, 'https://example.com/audio3.mp3', true),
  ('Building Your Team', 'How to recruit and manage your first employees', 'Leadership', 1, 1200, 'https://example.com/audio4.mp3', true),
  ('Digital Marketing Basics', 'Introduction to online marketing strategies', 'Marketing', 1, 840, 'https://example.com/audio5.mp3', true)
ON CONFLICT (title, series, episode_number) DO NOTHING;

-- Make your user an admin (REPLACE WITH YOUR ACTUAL EMAIL)
-- Uncomment and modify the line below with your email:
-- UPDATE user_profiles SET is_admin = true WHERE email = 'your-email@example.com';

COMMIT;