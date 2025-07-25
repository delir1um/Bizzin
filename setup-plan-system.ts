#!/usr/bin/env tsx
/**
 * Setup script to create plan system database tables in Supabase
 * Run with: npx tsx setup-plan-system.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupPlanSystem() {
  console.log('🚀 Setting up plan system database tables...')

  try {
    // Create user_plans table
    const { error: userPlansError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_plans (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE,
          UNIQUE(user_id)
        );
      `
    })

    if (userPlansError) {
      console.error('Error creating user_plans table:', userPlansError)
      return
    }

    // Create usage_limits table
    const { error: usageLimitsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS usage_limits (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          month_year VARCHAR(7) NOT NULL,
          documents_uploaded INTEGER DEFAULT 0,
          journal_entries_created INTEGER DEFAULT 0,
          goals_created INTEGER DEFAULT 0,
          calculator_uses JSONB DEFAULT '{}',
          storage_used BIGINT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(user_id, month_year)
        );
      `
    })

    if (usageLimitsError) {
      console.error('Error creating usage_limits table:', usageLimitsError)
      return
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
        ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
      `
    })

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError)
      return
    }

    // Create RLS policies
    const { error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Policies for user_plans
        CREATE POLICY IF NOT EXISTS "Users can view own plan" ON user_plans FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY IF NOT EXISTS "Users can update own plan" ON user_plans FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY IF NOT EXISTS "Users can insert own plan" ON user_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

        -- Policies for usage_limits
        CREATE POLICY IF NOT EXISTS "Users can view own usage" ON usage_limits FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY IF NOT EXISTS "Users can update own usage" ON usage_limits FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY IF NOT EXISTS "Users can insert own usage" ON usage_limits FOR INSERT WITH CHECK (auth.uid() = user_id);
      `
    })

    if (policiesError) {
      console.error('Error creating policies:', policiesError)
      return
    }

    console.log('✅ Plan system database setup completed successfully!')
    console.log('📋 Tables created: user_plans, usage_limits')
    console.log('🔒 RLS policies enabled')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupPlanSystem()