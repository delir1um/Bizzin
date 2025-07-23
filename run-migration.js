#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

console.log('Connecting to Supabase...')
const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('Running migration: Adding related_goal_id column to journal_entries...')
    
    // Try to add the column using Supabase RPC or direct SQL
    const { data, error } = await supabase.rpc('run_sql', {
      query: `
        ALTER TABLE journal_entries 
        ADD COLUMN IF NOT EXISTS related_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_journal_entries_related_goal_id 
        ON journal_entries(related_goal_id);
      `
    })

    if (error) {
      console.error('Migration failed:', error.message)
      console.log('\nThis is expected - the anon key cannot run DDL commands.')
      console.log('Please run the migration manually in your Supabase SQL Editor:')
      console.log('\n--- COPY THIS SQL ---')
      console.log(`
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS related_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_journal_entries_related_goal_id 
ON journal_entries(related_goal_id);

COMMENT ON COLUMN journal_entries.related_goal_id IS 'Optional reference to a related goal for cross-feature integration';
      `)
      console.log('--- END SQL ---\n')
      return false
    }

    console.log('Migration completed successfully!')
    return true
  } catch (err) {
    console.error('Unexpected error:', err.message)
    return false
  }
}

runMigration().then(success => {
  if (success) {
    console.log('✅ Database migration completed!')
  } else {
    console.log('❌ Migration must be run manually in Supabase dashboard')
  }
  process.exit(success ? 0 : 1)
})