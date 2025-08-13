#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addProgressColumns() {
  console.log('🛠️  Adding missing progress tracking columns to goals table...')
  
  try {
    // Add current_value column
    const { error: currentValueError } = await supabase.rpc('sql', {
      query: 'ALTER TABLE goals ADD COLUMN IF NOT EXISTS current_value NUMERIC;'
    })
    
    if (currentValueError) {
      console.error('Error adding current_value column:', currentValueError)
    } else {
      console.log('✅ Added current_value column')
    }

    // Add target_value column  
    const { error: targetValueError } = await supabase.rpc('sql', {
      query: 'ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_value NUMERIC;'
    })
    
    if (targetValueError) {
      console.error('Error adding target_value column:', targetValueError)
    } else {
      console.log('✅ Added target_value column')
    }

    console.log('🎯 Progress tracking columns added successfully!')
    
  } catch (err) {
    console.error('Error:', err)
  }
}

addProgressColumns()