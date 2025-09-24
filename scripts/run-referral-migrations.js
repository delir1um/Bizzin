#!/usr/bin/env node

/**
 * Run Referral System Database Migrations
 * This script executes the referral system SQL migrations against Supabase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Migration files in order
const migrationFiles = [
  'database/migrations/001_referral_system_schema.sql',
  'database/migrations/002_backfill_referral_codes.sql'
];

async function runMigrations() {
  console.log('🚀 Starting referral system migrations...\n');

  for (const migrationFile of migrationFiles) {
    console.log(`📂 Running migration: ${migrationFile}`);
    
    try {
      // Check if file exists
      if (!fs.existsSync(migrationFile)) {
        console.error(`❌ Migration file not found: ${migrationFile}`);
        process.exit(1);
      }

      // Read the SQL content
      const sqlContent = fs.readFileSync(migrationFile, 'utf8');
      
      // Create a temporary file for the SQL
      const tempFile = path.join(__dirname, 'temp_migration.sql');
      fs.writeFileSync(tempFile, sqlContent);

      // Run the migration using existing run-sql script
      console.log('   Executing SQL...');
      execSync(`node scripts/run-sql.js ${tempFile}`, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });

      // Clean up temp file
      fs.unlinkSync(tempFile);

      console.log(`✅ Migration completed: ${migrationFile}\n`);
      
    } catch (error) {
      console.error(`❌ Migration failed: ${migrationFile}`);
      console.error(error.message);
      process.exit(1);
    }
  }

  console.log('🎉 All referral system migrations completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Verify the tables were created in Supabase dashboard');
  console.log('2. Check that existing users now have referral_code values');
  console.log('3. Test referral code generation function');
}

// Check if DATABASE_URL is configured
if (!process.env.DATABASE_URL && !process.env.VITE_SUPABASE_URL) {
  console.error('❌ DATABASE_URL or VITE_SUPABASE_URL environment variable is required');
  process.exit(1);
}

runMigrations().catch(error => {
  console.error('❌ Migration process failed:', error);
  process.exit(1);
});