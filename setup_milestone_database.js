#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('Setting up milestone database schema...')
  
  try {
    // Read the SQL file
    const sql = readFileSync('create_database_schema.sql', 'utf8')
    
    // Split into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)
    
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...')
      
      // Use the rpc method to execute raw SQL if available
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.log('RPC not available, trying alternative approach')
          break
        }
        console.log('✓ Statement executed successfully')
      } catch (err) {
        console.log('RPC method not available, will need manual setup')
        break
      }
    }
    
    // Test the setup by trying to access both tables
    console.log('Testing database setup...')
    
    // Test goals table with new column
    const { data: goalTest, error: goalError } = await supabase
      .from('goals')
      .select('id, progress_type')
      .limit(1)
    
    if (goalError && goalError.code === '42703') {
      console.log('❌ progress_type column not added to goals table')
      console.log('Manual step required: Add progress_type column to goals table')
    } else {
      console.log('✓ Goals table ready with progress_type column')
    }
    
    // Test milestones table
    const { data: milestoneTest, error: milestoneError } = await supabase
      .from('milestones')
      .select('id')
      .limit(1)
    
    if (milestoneError && milestoneError.code === '42P01') {
      console.log('❌ Milestones table not created')
      console.log('Manual step required: Create milestones table')
    } else {
      console.log('✓ Milestones table ready')
    }
    
    if (!goalError && !milestoneError) {
      console.log('🎉 Database schema setup complete!')
      console.log('Ready for Phase 1 testing with authentic data')
    }
    
  } catch (error) {
    console.error('Setup error:', error)
    console.log('Manual database setup required using Supabase dashboard')
  }
}

setupDatabase()