-- Debug Admin Access for anton@cloudfusion.co.za
-- Run this to check if admin setup worked correctly

-- 1. Check if admin_users table exists and has data
SELECT 'Checking admin_users table:' as step;
SELECT user_id, email, is_admin, created_at 
FROM admin_users 
WHERE email = 'anton@cloudfusion.co.za';

-- 2. Check if user exists in auth.users
SELECT 'Checking auth.users table:' as step;
SELECT id, email, created_at, last_sign_in_at
FROM auth.users 
WHERE email = 'anton@cloudfusion.co.za';

-- 3. Try to insert admin user if missing
INSERT INTO admin_users (user_id, email, is_admin)
SELECT id, email, true 
FROM auth.users 
WHERE email = 'anton@cloudfusion.co.za'
ON CONFLICT (user_id) DO UPDATE SET is_admin = true;

-- 4. Verify admin user was created/updated
SELECT 'Final verification:' as step;
SELECT 
  au.user_id, 
  au.email, 
  au.is_admin, 
  au.created_at as admin_created_at,
  u.created_at as user_created_at,
  u.last_sign_in_at
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE au.email = 'anton@cloudfusion.co.za';

-- 5. Check RLS policies on admin_users table
SELECT 'Checking RLS policies:' as step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'admin_users';