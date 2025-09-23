-- Fix Supabase schema to support premium plan migration
-- Run this in your Supabase SQL Editor

-- Create user_plans table with complete schema
CREATE TABLE IF NOT EXISTS user_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type VARCHAR NOT NULL,
  billing_cycle VARCHAR,
  amount_paid NUMERIC,
  currency VARCHAR,
  paystack_customer_code VARCHAR,
  paystack_subscription_code VARCHAR,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  referral_days_remaining INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_trial BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMPTZ,
  referral_bonus_applied BOOLEAN DEFAULT FALSE,
  payment_status VARCHAR DEFAULT 'pending',
  grace_period_end TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  failed_payment_count INTEGER DEFAULT 0
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id VARCHAR PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  business_name VARCHAR,
  business_type VARCHAR,
  phone VARCHAR,
  bio TEXT,
  avatar_url VARCHAR,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_plans
DROP POLICY IF EXISTS "Users can view own plans" ON user_plans;
CREATE POLICY "Users can view own plans" ON user_plans
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service can manage all plans" ON user_plans;
CREATE POLICY "Service can manage all plans" ON user_plans
  FOR ALL USING (true);

-- RLS policies for user_profiles  
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = user_id);
  
DROP POLICY IF EXISTS "Service can manage all profiles" ON user_profiles;
CREATE POLICY "Service can manage all profiles" ON user_profiles
  FOR ALL USING (true);

-- Insert your premium data directly
INSERT INTO user_profiles (
  user_id, email, full_name, first_name, last_name, 
  business_name, business_type, is_admin, created_at, updated_at
) VALUES (
  '9502ea97-1adb-4115-ba05-1b6b1b5fa721',
  'anton@cloudfusion.co.za',
  'Anton Bosch',
  'Anton',
  'Vorster', 
  'CloudFusion',
  'Technology Solutions',
  true,
  '2025-07-22T18:19:16.489549+00:00',
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  business_name = EXCLUDED.business_name,
  is_admin = EXCLUDED.is_admin,
  updated_at = NOW();

-- Insert your premium plan
INSERT INTO user_plans (
  id, user_id, plan_type, started_at, expires_at, 
  created_at, updated_at, is_trial, payment_status, failed_payment_count
) VALUES (
  '968a00c9-8faf-4e16-ad68-b480ef6b3044',
  '9502ea97-1adb-4115-ba05-1b6b1b5fa721',
  'premium',
  '2025-09-23T08:55:31.932257+00:00',
  '2025-10-07T08:55:31.932257+00:00',
  '2025-09-23T08:55:31.932257+00:00',
  NOW(),
  false,
  'active',
  0
) ON CONFLICT (id) DO UPDATE SET
  plan_type = EXCLUDED.plan_type,
  payment_status = EXCLUDED.payment_status,
  expires_at = EXCLUDED.expires_at,
  updated_at = NOW();

-- Verify the migration
SELECT 'Profile Check' as check_type, email, full_name, business_name, is_admin 
FROM user_profiles 
WHERE user_id = '9502ea97-1adb-4115-ba05-1b6b1b5fa721';

SELECT 'Plan Check' as check_type, plan_type, payment_status, expires_at 
FROM user_plans 
WHERE user_id = '9502ea97-1adb-4115-ba05-1b6b1b5fa721';