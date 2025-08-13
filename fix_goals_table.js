#!/usr/bin/env node

// Direct SQL fix for goals table to add missing columns
// This approach manually executes SQL through Supabase client

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Need: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔧 Fixing goals table schema...')

async function addMissingColumns() {
  try {
    // First, let's check current table structure
    console.log('📋 Checking current goals table structure...')
    
    // Try to add the columns using a database function or check if they exist
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'goals')
      .eq('table_schema', 'public')
    
    if (columnError) {
      console.log('Cannot check columns, proceeding with manual approach...')
    } else {
      const existingColumns = columns?.map(c => c.column_name) || []
      console.log('Existing columns:', existingColumns)
      
      if (!existingColumns.includes('current_value')) {
        console.log('❌ current_value column missing')
      } else {
        console.log('✅ current_value column exists')
      }
      
      if (!existingColumns.includes('target_value')) {
        console.log('❌ target_value column missing')
      } else {
        console.log('✅ target_value column exists')
      }
    }
    
    // Since we can't execute DDL directly, let's create a test goal to see what happens
    console.log('\n🧪 Testing goal creation to identify exact issue...')
    
    const testGoal = {
      title: 'Test Goal Schema Fix',
      description: 'Testing automatic progress calculation',
      category: 'Testing',
      priority: 'medium',
      target_value: 1000,
      current_value: 100,
      progress: 10,
      status: 'in_progress',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      user_id: '00000000-0000-0000-0000-000000000000' // Test user ID
    }
    
    const { data, error } = await supabase
      .from('goals')
      .insert([testGoal])
      .select()
    
    if (error) {
      console.log('❌ Error creating test goal:', error.message)
      if (error.message.includes('current_value') || error.message.includes('target_value')) {
        console.log('\n💡 Confirmed: Missing columns in database')
        console.log('Solution: Need to add columns via Supabase Dashboard SQL Editor')
        console.log('\nSQL to run in Supabase Dashboard:')
        console.log('ALTER TABLE goals ADD COLUMN IF NOT EXISTS current_value NUMERIC;')
        console.log('ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_value NUMERIC;')
      }
    } else {
      console.log('✅ Test goal created successfully - columns exist!')
      console.log('Data:', data)
      
      // Clean up test goal
      await supabase.from('goals').delete().eq('id', data[0].id)
      console.log('🧹 Test goal cleaned up')
    }
    
  } catch (err) {
    console.error('💥 Error:', err)
  }
}

addMissingColumns()