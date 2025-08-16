#!/usr/bin/env node

// Initialize milestone system by creating database tables
// and adding the progress_type column to goals

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runDatabaseMigrations() {
  console.log('Running milestone system database migrations...')
  
  try {
    // First, try to modify the goals table to add progress_type column
    console.log('Step 1: Adding progress_type column to goals table...')
    
    // Test if the column already exists
    const { data: existingGoals, error: testError } = await supabase
      .from('goals')
      .select('progress_type')
      .limit(1)
    
    if (testError && testError.code === '42703') {
      console.log('Column does not exist, needs to be added manually')
      console.log('SQL to run in Supabase dashboard:')
      console.log('ALTER TABLE goals ADD COLUMN progress_type VARCHAR(20) DEFAULT \'manual\' CHECK (progress_type IN (\'manual\', \'milestone\'));')
    } else if (testError) {
      console.error('Error testing goals table:', testError)
      return false
    } else {
      console.log('✓ progress_type column already exists')
    }
    
    // Next, test milestones table
    console.log('Step 2: Testing milestones table...')
    
    const { data: existingMilestones, error: milestoneTestError } = await supabase
      .from('milestones')
      .select('id')
      .limit(1)
    
    if (milestoneTestError && milestoneTestError.code === '42P01') {
      console.log('Milestones table does not exist, needs to be created')
      return false
    } else if (milestoneTestError) {
      console.error('Error testing milestones table:', milestoneTestError)
      return false
    } else {
      console.log('✓ milestones table already exists')
    }
    
    return true
    
  } catch (error) {
    console.error('Migration error:', error)
    return false
  }
}

async function printSetupInstructions() {
  console.log('\n🔧 Manual Database Setup Required')
  console.log('=====================================')
  console.log('Please run the following SQL commands in your Supabase SQL editor:')
  console.log('')
  console.log('1. Add progress_type column to goals table:')
  console.log('')
  console.log('ALTER TABLE goals ADD COLUMN IF NOT EXISTS progress_type VARCHAR(20) DEFAULT \'manual\' CHECK (progress_type IN (\'manual\', \'milestone\'));')
  console.log('')
  console.log('2. Create milestones table:')
  console.log('')
  console.log(`CREATE TABLE IF NOT EXISTS milestones (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);

-- Enable RLS
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own milestones" ON milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones" ON milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones" ON milestones
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milestones" ON milestones
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`)
  
  console.log('')
  console.log('3. After running the SQL, test the system by running:')
  console.log('   node verify_milestone_setup.js')
  console.log('')
}

async function main() {
  const isReady = await runDatabaseMigrations()
  
  if (!isReady) {
    await printSetupInstructions()
  } else {
    console.log('🎉 Database is ready for milestone system!')
    console.log('You can now test the milestone functionality.')
  }
}

main()