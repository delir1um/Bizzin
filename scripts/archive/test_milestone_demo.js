#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestMilestoneGoal() {
  console.log('Creating test goal for milestone functionality...')
  
  try {
    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('No authenticated user found. Please sign in to the app first.')
      console.log('This demo needs to be run while logged into the application.')
      return
    }
    
    console.log('Authenticated user:', user.email)
    
    // Create a test goal with milestone indicator in description
    const testGoal = {
      title: 'Phase 1 Milestone Testing - Launch MVP',
      description: 'milestone: This goal will test the new milestone tracking system with actionable steps toward launching our MVP product.',
      status: 'in_progress',
      progress: 0,
      target_value: 100,
      current_value: 0,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      user_id: user.id,
      priority: 'high',
      category: 'Product Development'
    }
    
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .insert([testGoal])
      .select()
      .single()
    
    if (goalError) {
      console.error('Error creating test goal:', goalError)
      return
    }
    
    console.log('✅ Test goal created successfully!')
    console.log('Goal ID:', goal.id)
    console.log('Title:', goal.title)
    console.log('Description:', goal.description)
    console.log('')
    console.log('🎯 Test Instructions:')
    console.log('1. Go to the Goals page in the application')
    console.log('2. Find the "Phase 1 Milestone Testing" goal')
    console.log('3. Look for the milestone section at the bottom of the goal card')
    console.log('4. Try adding, checking off, and managing milestones')
    console.log('5. Observe how progress updates automatically based on milestone completion')
    console.log('')
    console.log('Note: This is Phase 1 implementation with graceful fallbacks for database schema')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createTestMilestoneGoal()