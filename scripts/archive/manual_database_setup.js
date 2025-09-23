#!/usr/bin/env node

// Manual database setup for milestone system
// This creates the necessary tables using individual Supabase operations

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupTables() {
  console.log('Setting up milestone tables using direct operations...')
  
  try {
    // First, let's check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('⚠️  No authenticated user. Please log in to the app first.')
      console.log('Then run this script to set up the database tables.')
      return
    }
    
    console.log('Authenticated as:', user.email)
    
    // Test if goals table exists and try to access progress_type
    console.log('Testing goals table...')
    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .select('id, progress_type')
      .limit(1)
    
    if (goalError) {
      if (goalError.code === '42703') {
        console.log('❌ progress_type column missing from goals table')
        console.log('📝 Manual SQL needed:')
        console.log('ALTER TABLE goals ADD COLUMN progress_type VARCHAR(20) DEFAULT \'manual\' CHECK (progress_type IN (\'manual\', \'milestone\'));')
      } else {
        console.error('Goals table error:', goalError)
      }
    } else {
      console.log('✅ Goals table ready with progress_type column')
    }
    
    // Test milestones table
    console.log('Testing milestones table...')
    const { data: milestoneData, error: milestoneError } = await supabase
      .from('milestones')
      .select('id')
      .limit(1)
    
    if (milestoneError) {
      if (milestoneError.code === '42P01') {
        console.log('❌ Milestones table does not exist')
        console.log('📝 Manual SQL needed - run this in Supabase SQL editor:')
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

CREATE INDEX idx_milestones_goal_id ON milestones(goal_id);
CREATE INDEX idx_milestones_user_id ON milestones(user_id);

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
        console.error('Milestones table error:', milestoneError)
      }
    } else {
      console.log('✅ Milestones table ready')
    }
    
    // If both tables are ready, create a test milestone goal
    if (!goalError && !milestoneError) {
      console.log('🎉 Database ready! Creating test milestone goal...')
      
      const testGoal = {
        title: 'Launch Product MVP',
        description: 'Complete all necessary steps to launch our minimum viable product to the market',
        status: 'in_progress',
        progress: 0,
        progress_type: 'milestone',
        target_value: 100,
        current_value: 0,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        user_id: user.id,
        priority: 'high',
        category: 'Product Development'
      }
      
      const { data: goal, error: createError } = await supabase
        .from('goals')
        .insert([testGoal])
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating test goal:', createError)
      } else {
        console.log('✅ Test milestone goal created:', goal.title)
        console.log('Goal ID:', goal.id)
        
        // Create initial milestones
        const milestones = [
          {
            goal_id: goal.id,
            title: 'Complete market research',
            description: 'Analyze target market and competitors',
            status: 'todo',
            order_index: 0,
            weight: 1,
            user_id: user.id
          },
          {
            goal_id: goal.id,
            title: 'Develop core features',
            description: 'Build the essential functionality for MVP',
            status: 'todo',
            order_index: 1,
            weight: 2,
            user_id: user.id
          },
          {
            goal_id: goal.id,
            title: 'User testing & feedback',
            description: 'Conduct beta testing with target users',
            status: 'todo',
            order_index: 2,
            weight: 1,
            user_id: user.id
          },
          {
            goal_id: goal.id,
            title: 'Launch preparation',
            description: 'Marketing materials, documentation, launch strategy',
            status: 'todo',
            order_index: 3,
            weight: 1,
            user_id: user.id
          }
        ]
        
        const { data: createdMilestones, error: milestoneCreateError } = await supabase
          .from('milestones')
          .insert(milestones)
          .select()
        
        if (milestoneCreateError) {
          console.error('Error creating milestones:', milestoneCreateError)
        } else {
          console.log(`✅ Created ${createdMilestones.length} test milestones`)
          console.log('🚀 Phase 1 ready for testing!')
        }
      }
    }
    
  } catch (error) {
    console.error('Setup error:', error)
  }
}

setupTables()