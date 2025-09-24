#!/usr/bin/env node

/**
 * Run Referral System Database Migrations via Supabase RPC
 * This script executes the referral system SQL migrations against the Supabase cloud database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Need: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Starting referral system migrations via Supabase...\n');

async function runMigration(migrationFile, description) {
  console.log(`📂 Running migration: ${description}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(migrationFile)) {
      console.error(`❌ Migration file not found: ${migrationFile}`);
      return false;
    }

    // Read the SQL content
    const sqlContent = fs.readFileSync(migrationFile, 'utf8');
    console.log(`   SQL content length: ${sqlContent.length} characters`);
    
    // Execute via Supabase RPC
    console.log('   Executing SQL via Supabase...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });

    if (error) {
      console.error(`❌ Migration failed: ${description}`);
      console.error('Error details:', error);
      return false;
    }

    console.log(`✅ Migration completed: ${description}\n`);
    return true;
    
  } catch (error) {
    console.error(`❌ Migration failed: ${description}`);
    console.error('Error:', error.message);
    return false;
  }
}

async function runAllMigrations() {
  try {
    // Migration 1: Schema setup
    const schema1Success = await runMigration(
      'database/migrations/001_referral_system_schema.sql',
      'Referral System Schema Setup'
    );
    
    if (!schema1Success) {
      console.error('❌ Schema migration failed. Stopping.');
      process.exit(1);
    }
    
    // Migration 2: Backfill referral codes
    const schema2Success = await runMigration(
      'database/migrations/002_backfill_referral_codes.sql', 
      'Backfill Referral Codes for Existing Users'
    );
    
    if (!schema2Success) {
      console.error('❌ Backfill migration failed. Stopping.');
      process.exit(1);
    }

    console.log('🎉 All referral system migrations completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify the tables were created in Supabase dashboard');
    console.log('2. Check that existing users now have referral_code values');
    console.log('3. Test referral code generation function');
    console.log('4. Restart the application to clear any client-side caching');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  }
}

runAllMigrations();