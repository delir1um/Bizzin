#!/usr/bin/env node

// Fix Supabase schema to match Neon schema structure
// This creates the proper user_plans table with all required columns

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUserPlansTable() {
  try {
    console.log('🔧 Creating user_plans table with complete schema...');
    
    const createTableSQL = `
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
    `;

    const { error: createError } = await supabase.rpc('execute_sql', { 
      sql_query: createTableSQL 
    });

    if (createError) {
      console.error('❌ Table creation error:', createError);
      return false;
    }

    console.log('✅ user_plans table created/updated successfully');

    // Create user_profiles table if it doesn't exist
    console.log('🔧 Creating user_profiles table...');
    
    const createProfilesSQL = `
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
    `;

    const { error: profileError } = await supabase.rpc('execute_sql', { 
      sql_query: createProfilesSQL 
    });

    if (profileError) {
      console.error('❌ user_profiles creation error:', profileError);
      return false;
    }

    console.log('✅ user_profiles table created/updated successfully');

    // Enable RLS
    console.log('🔒 Enabling Row Level Security...');
    
    const rlsSQL = `
      ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
      
      -- RLS policies for user_plans
      DROP POLICY IF EXISTS "Users can view own plans" ON user_plans;
      CREATE POLICY "Users can view own plans" ON user_plans
        FOR SELECT USING (auth.uid() = user_id::uuid);
      
      DROP POLICY IF EXISTS "Service can manage all plans" ON user_plans;
      CREATE POLICY "Service can manage all plans" ON user_plans
        FOR ALL USING (true);
      
      -- RLS policies for user_profiles  
      DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
      CREATE POLICY "Users can view own profile" ON user_profiles
        FOR SELECT USING (auth.uid() = user_id::uuid);
        
      DROP POLICY IF EXISTS "Service can manage all profiles" ON user_profiles;
      CREATE POLICY "Service can manage all profiles" ON user_profiles
        FOR ALL USING (true);
    `;

    const { error: rlsError } = await supabase.rpc('execute_sql', { 
      sql_query: rlsSQL 
    });

    if (rlsError) {
      console.error('❌ RLS setup error:', rlsError);
      return false;
    }

    console.log('✅ Row Level Security configured successfully');
    console.log('🎉 Supabase schema setup completed!');
    
    return true;

  } catch (error) {
    console.error('❌ Schema setup failed:', error);
    return false;
  }
}

createUserPlansTable();