-- Direct admin test for anton@cloudfusion.co.za
-- Run this to immediately set up admin access

-- Step 1: Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  is_admin boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Step 2: Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view admin table" ON admin_users;
DROP POLICY IF EXISTS "Admin access policy" ON admin_users;

-- Step 4: Create simple policy that allows admins to see themselves
CREATE POLICY "Admin access policy" ON admin_users
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.email() = email OR 
    is_admin = true
  );

-- Step 5: Force insert admin user for anton@cloudfusion.co.za
DELETE FROM admin_users WHERE email = 'anton@cloudfusion.co.za';

INSERT INTO admin_users (user_id, email, is_admin)
SELECT id, 'anton@cloudfusion.co.za', true 
FROM auth.users 
WHERE email = 'anton@cloudfusion.co.za';

-- Step 6: Verify the setup
SELECT 'Admin setup verification:' as status;
SELECT 
  au.user_id, 
  au.email, 
  au.is_admin, 
  au.created_at,
  u.email as auth_email,
  u.id as auth_id
FROM admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
WHERE au.email = 'anton@cloudfusion.co.za';

-- Step 7: Test the policy
SELECT 'Policy test - this should return data:' as test;
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "' || (SELECT id FROM auth.users WHERE email = 'anton@cloudfusion.co.za') || '", "email": "anton@cloudfusion.co.za"}';
SELECT * FROM admin_users WHERE email = 'anton@cloudfusion.co.za';