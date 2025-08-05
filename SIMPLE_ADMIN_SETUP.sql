-- Simple Admin Setup for Existing Supabase Database
-- This works with Supabase's built-in auth.users table
-- Run this in your Supabase SQL editor

-- 1. Create a simple admin_users table to track admin status
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  is_admin boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Create early_signups table for pre-launch leads
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

-- 3. Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE early_signups ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Admin users can view admin table
CREATE POLICY "Admins can view admin table" ON admin_users
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Anyone can insert early signups (for public forms)
CREATE POLICY "Allow public signup insertion" ON early_signups
  FOR INSERT WITH CHECK (true);

-- Admins can view and manage early signups
CREATE POLICY "Admins can manage signups" ON early_signups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_early_signups_email ON early_signups(email);
CREATE INDEX IF NOT EXISTS idx_early_signups_date ON early_signups(signup_date);

-- 6. Insert your admin user (REPLACE WITH YOUR ACTUAL EMAIL)
-- Make sure to replace 'your-email@example.com' with your actual email
INSERT INTO admin_users (user_id, email, is_admin)
SELECT id, email, true 
FROM auth.users 
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO UPDATE SET is_admin = true;

-- 7. Show what tables exist in your database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;