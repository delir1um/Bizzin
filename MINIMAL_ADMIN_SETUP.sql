-- Minimal Admin Setup - Avoids conflicts with existing policies
-- Run this in your Supabase SQL editor

-- 1. Create admin_users table (simple admin tracking)
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  is_admin boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policy for admin_users (only admins can view)
DROP POLICY IF EXISTS "Admins can view admin table" ON admin_users;
CREATE POLICY "Admins can view admin table" ON admin_users
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- 5. Insert your admin user (REPLACE 'your-email@example.com' WITH YOUR ACTUAL EMAIL)
-- Make sure to replace the email with your actual email address
INSERT INTO admin_users (user_id, email, is_admin)
SELECT id, email, true 
FROM auth.users 
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO UPDATE SET is_admin = true;

-- 6. Verify the setup worked
SELECT 'Setup completed successfully. Admin user created:' as status;
SELECT user_id, email, is_admin, created_at 
FROM admin_users 
WHERE email = 'your-email@example.com';