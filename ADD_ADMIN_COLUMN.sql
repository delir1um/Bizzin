-- Add admin column to user_profiles table
-- Run this in your Supabase SQL editor

-- Add is_admin column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);

-- Update RLS policy to allow admins to view all profiles
CREATE POLICY "Allow admins to view all profiles" ON user_profiles
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- Make your user an admin (replace with your actual email)
-- UPDATE user_profiles SET is_admin = true WHERE email = 'your-email@example.com';

-- Optional: Create admin role for better organization
-- You can also create a separate admins table if needed
/*
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role varchar(50) NOT NULL DEFAULT 'admin',
  permissions jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin roles
CREATE POLICY "Only admins can view admin roles" ON admin_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );
*/