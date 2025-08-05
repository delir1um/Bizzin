-- Check what user-related tables exist in your Supabase database
-- Run this first to see your current database structure

-- Check all public tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check user_profiles table structure (if it exists)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check what columns exist in auth.users (system table)
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Show sample user data (first 5 users) to understand the structure
-- Only run this if you have users in your database
-- SELECT id, email, created_at, last_sign_in_at, user_metadata
-- FROM auth.users 
-- LIMIT 5;