#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addProgressTypeColumn() {
  console.log('Adding progress_type column to goals table...')
  
  try {
    // Test if we can access the goals table
    const { data: testGoals, error: testError } = await supabase
      .from('goals')
      .select('id, progress_type')
      .limit(1)
    
    if (!testError && testGoals) {
      console.log('progress_type column already exists')
      return
    }
    
    if (testError && testError.code === 'PGRST116') {
      console.log('Column does not exist, but table exists. This is expected.')
    } else if (testError) {
      console.error('Unexpected error:', testError)
      return
    }
    
    // Since we can't use SQL directly, we'll update the existing goals to add the column via Supabase dashboard
    console.log('❗ Manual step required:')
    console.log('Please add the following column to the goals table in Supabase dashboard:')
    console.log('Column name: progress_type')
    console.log('Type: text')
    console.log('Default value: manual')
    console.log('Check constraint: progress_type IN (\'manual\', \'milestone\')')
    
    // Test creating a simple milestone record to see if table exists
    console.log('Testing milestone table access...')
    const { data: testMilestones, error: milestoneError } = await supabase
      .from('milestones')
      .select('id')
      .limit(1)
    
    if (milestoneError) {
      console.log('Milestones table does not exist. Manual creation required.')
      console.log('❗ Please create milestones table in Supabase with the following structure:')
      console.log(`
CREATE TABLE milestones (
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

-- Indexes
CREATE INDEX idx_milestones_goal_id ON milestones(goal_id);
CREATE INDEX idx_milestones_user_id ON milestones(user_id);

-- RLS Policies (enable RLS first)
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own milestones" ON milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones" ON milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones" ON milestones
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milestones" ON milestones
  FOR DELETE USING (auth.uid() = user_id);
      `)
    } else {
      console.log('Milestones table already exists')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

addProgressTypeColumn()