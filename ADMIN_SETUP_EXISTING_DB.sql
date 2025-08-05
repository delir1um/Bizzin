-- Admin Setup for Existing Database
-- This assumes your existing tables already exist
-- Run this in your Supabase SQL editor

-- 1. Add admin column to existing user_profiles table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE user_profiles ADD COLUMN is_admin boolean DEFAULT false;
        CREATE INDEX idx_user_profiles_is_admin ON user_profiles(is_admin);
    END IF;
END $$;

-- 2. Create early_signups table for pre-launch leads (if it doesn't exist)
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

-- Create indexes for early_signups
CREATE INDEX IF NOT EXISTS idx_early_signups_email ON early_signups(email);
CREATE INDEX IF NOT EXISTS idx_early_signups_date ON early_signups(signup_date);
CREATE INDEX IF NOT EXISTS idx_early_signups_business_type ON early_signups(business_type);

-- 3. Enable RLS on early_signups
ALTER TABLE early_signups ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for early_signups
DROP POLICY IF EXISTS "Allow public signup insertion" ON early_signups;
CREATE POLICY "Allow public signup insertion" ON early_signups
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to view signups" ON early_signups;
CREATE POLICY "Allow authenticated users to view signups" ON early_signups
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update signups" ON early_signups;
CREATE POLICY "Allow authenticated users to update signups" ON early_signups
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Create admin-friendly RLS policies for existing tables
-- These policies allow admins to view data from all users

-- Policy for user_profiles (admin access)
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- Check if user_plans table exists and create admin policy
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_plans') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all plans" ON user_plans';
        EXECUTE 'CREATE POLICY "Admins can view all plans" ON user_plans
                 FOR SELECT USING (
                   auth.uid() = user_id OR 
                   EXISTS (
                     SELECT 1 FROM user_profiles 
                     WHERE user_id = auth.uid() 
                     AND is_admin = true
                   )
                 )';
    END IF;
END $$;

-- Check if journal_entries table exists and create admin policy
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all journal entries" ON journal_entries';
        EXECUTE 'CREATE POLICY "Admins can view all journal entries" ON journal_entries
                 FOR SELECT USING (
                   auth.uid() = user_id OR 
                   EXISTS (
                     SELECT 1 FROM user_profiles 
                     WHERE user_id = auth.uid() 
                     AND is_admin = true
                   )
                 )';
    END IF;
END $$;

-- Check if goals table exists and create admin policy
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all goals" ON goals';
        EXECUTE 'CREATE POLICY "Admins can view all goals" ON goals
                 FOR SELECT USING (
                   auth.uid() = user_id OR 
                   EXISTS (
                     SELECT 1 FROM user_profiles 
                     WHERE user_id = auth.uid() 
                     AND is_admin = true
                   )
                 )';
    END IF;
END $$;

-- Check if documents table exists and create admin policy
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all documents" ON documents';
        EXECUTE 'CREATE POLICY "Admins can view all documents" ON documents
                 FOR SELECT USING (
                   auth.uid() = user_id OR 
                   EXISTS (
                     SELECT 1 FROM user_profiles 
                     WHERE user_id = auth.uid() 
                     AND is_admin = true
                   )
                 )';
    END IF;
END $$;

-- Check if podcast_episodes table exists and create admin policy
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'podcast_episodes') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Admins can manage all episodes" ON podcast_episodes';
        EXECUTE 'CREATE POLICY "Admins can manage all episodes" ON podcast_episodes
                 FOR ALL USING (
                   EXISTS (
                     SELECT 1 FROM user_profiles 
                     WHERE user_id = auth.uid() 
                     AND is_admin = true
                   )
                 )';
    END IF;
END $$;

-- Check if podcast_progress table exists and create admin policy
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'podcast_progress') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all progress" ON podcast_progress';
        EXECUTE 'CREATE POLICY "Admins can view all progress" ON podcast_progress
                 FOR SELECT USING (
                   auth.uid() = user_id OR 
                   EXISTS (
                     SELECT 1 FROM user_profiles 
                     WHERE user_id = auth.uid() 
                     AND is_admin = true
                   )
                 )';
    END IF;
END $$;

-- 6. Make your user an admin
-- IMPORTANT: Replace 'your-email@example.com' with your actual email address
-- UPDATE user_profiles SET is_admin = true WHERE email = 'your-email@example.com';

-- 7. Show current table structure for verification
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('user_profiles', 'user_plans', 'journal_entries', 'goals', 'documents', 'podcast_episodes', 'podcast_progress', 'early_signups')
ORDER BY table_name, ordinal_position;