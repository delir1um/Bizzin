#!/usr/bin/env node

// Script to add missing cancelled_at column to user_plans table
// This fixes the PostgreSQL error: "column user_plans.cancelled_at does not exist"

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Error: VITE_SUPABASE_URL environment variable is required');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCancelledAtColumn() {
  try {
    console.log('🔧 Adding cancelled_at column to user_plans table...');
    
    // Execute the SQL to add the missing column using direct HTTP request
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE public.user_plans ADD COLUMN IF NOT EXISTS cancelled_at timestamptz NULL;'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, errorText);
      
      // Try alternative approach: direct SQL execution
      console.log('🔄 Trying alternative approach...');
      console.log('❌ Cannot execute DDL statements through Supabase client.');
      console.log('📋 MANUAL ACTION REQUIRED:');
      console.log('   1. Go to your Supabase project dashboard');
      console.log('   2. Open the SQL Editor');
      console.log('   3. Run this SQL command:');
      console.log('   ALTER TABLE public.user_plans ADD COLUMN IF NOT EXISTS cancelled_at timestamptz NULL;');
      console.log('');
      console.log('🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql');
      process.exit(1);
    }

    if (error) {
      console.error('❌ Error adding column:', error);
      process.exit(1);
    }

    console.log('✅ Successfully added cancelled_at column to user_plans table');
    
    // Verify the column was added by checking table structure
    console.log('🔍 Verifying column was added...');
    const { data: testData, error: testError } = await supabase
      .from('user_plans')
      .select('cancelled_at')
      .limit(1);

    if (testError) {
      console.error('❌ Error verifying column:', testError);
      process.exit(1);
    }

    console.log('✅ Column verification successful - cancelled_at is now available');
    console.log('🎉 Schema fix complete! The "column user_plans.cancelled_at does not exist" error should be resolved');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

// Run the script
addCancelledAtColumn();