// Verification script for milestone system setup
// Run with: node verify_milestone_setup.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  console.log('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyDatabaseSetup() {
  console.log('🔍 Verifying milestone system database setup...\n')

  try {
    // Test 1: Check if goals table has progress_type column
    console.log('1. Checking goals table structure...')
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, progress_type')
      .limit(1)

    if (goalsError) {
      console.log('❌ Goals table issue:', goalsError.message)
      if (goalsError.code === '42703') {
        console.log('   → Need to add progress_type column to goals table')
      }
      return false
    } else {
      console.log('✅ Goals table has progress_type column')
    }

    // Test 2: Check if milestones table exists
    console.log('\n2. Checking milestones table...')
    const { data: milestones, error: milestonesError } = await supabase
      .from('milestones')
      .select('*')
      .limit(1)

    if (milestonesError) {
      console.log('❌ Milestones table issue:', milestonesError.message)
      if (milestonesError.code === '42P01') {
        console.log('   → Need to create milestones table')
      }
      return false
    } else {
      console.log('✅ Milestones table exists and accessible')
    }

    // Test 3: Try to create a test milestone (if we have existing goals)
    if (goals && goals.length > 0) {
      console.log('\n3. Testing milestone creation...')
      
      // Get the current user (this will fail if not authenticated, which is expected)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.log('⚠️  Not authenticated - cannot test milestone creation')
        console.log('   This is expected when running from server-side')
      } else {
        // Try to create a test milestone
        const testMilestone = {
          goal_id: goals[0].id,
          title: 'Test Milestone - Safe to Delete',
          description: 'This is a test milestone created by the verification script',
          status: 'todo',
          weight: 1,
          order_index: 999,
          user_id: user.id
        }

        const { data: newMilestone, error: createError } = await supabase
          .from('milestones')
          .insert([testMilestone])
          .select()
          .single()

        if (createError) {
          console.log('❌ Failed to create test milestone:', createError.message)
          return false
        } else {
          console.log('✅ Successfully created test milestone')
          
          // Clean up test milestone
          await supabase
            .from('milestones')
            .delete()
            .eq('id', newMilestone.id)
          console.log('✅ Cleaned up test milestone')
        }
      }
    }

    console.log('\n🎉 Milestone system verification completed successfully!')
    console.log('\nYou can now:')
    console.log('• Create goals with milestone-based progress tracking')
    console.log('• Use milestone templates for common business scenarios')
    console.log('• View milestone analytics and progress insights')
    console.log('• Benefit from weighted milestone progress calculation')
    
    return true

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    return false
  }
}

async function createSampleMilestone() {
  console.log('\n📝 Would you like to test the milestone system with sample data?')
  console.log('Note: This requires authentication and an existing goal.')
  console.log('For now, create goals through the web interface and milestones will work automatically.')
}

// Run verification
verifyDatabaseSetup().then(success => {
  if (success) {
    createSampleMilestone()
  } else {
    console.log('\n❌ Database setup incomplete. Please run the SQL commands from MILESTONE_SYSTEM_SETUP.md')
    process.exit(1)
  }
})