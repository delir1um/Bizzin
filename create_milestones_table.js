#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createMilestonesTable() {
  console.log('Creating milestones table...')
  
  try {
    // Check if table exists first
    const { data: tableExists, error: checkError } = await supabase
      .from('milestones')
      .select('id')
      .limit(1)
    
    if (!checkError) {
      console.log('Milestones table already exists')
      return
    }
    
    console.log('Table does not exist, creating...')
    
    // Create table using Supabase SQL execution
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS milestones (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
        due_date TIMESTAMPTZ,
        weight INTEGER DEFAULT 1 CHECK (weight > 0),
        order_index INTEGER NOT NULL DEFAULT 0,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Create index for performance
      CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON milestones(goal_id);
      CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);
      CREATE INDEX IF NOT EXISTS idx_milestones_order ON milestones(goal_id, order_index);
      
      -- Add RLS policies
      ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
      
      -- Policy for users to read their own milestones
      CREATE POLICY "Users can view their own milestones" ON milestones
        FOR SELECT USING (auth.uid() = user_id);
      
      -- Policy for users to insert their own milestones
      CREATE POLICY "Users can insert their own milestones" ON milestones
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      -- Policy for users to update their own milestones
      CREATE POLICY "Users can update their own milestones" ON milestones
        FOR UPDATE USING (auth.uid() = user_id);
      
      -- Policy for users to delete their own milestones
      CREATE POLICY "Users can delete their own milestones" ON milestones
        FOR DELETE USING (auth.uid() = user_id);
      
      -- Function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      -- Trigger to automatically update updated_at
      CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (createError) {
      console.error('Error creating table:', createError)
      process.exit(1)
    }
    
    console.log('Successfully created milestones table with RLS policies and triggers')
    
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

createMilestonesTable()