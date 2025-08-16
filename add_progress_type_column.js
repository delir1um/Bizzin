// Add progress_type column to goals table and migrate existing data
// This script handles the migration from description-based milestone detection to proper progress_type field

import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateProgressType() {
  try {
    console.log('Starting progress_type migration...')

    // Step 1: Add the progress_type column if it doesn't exist
    console.log('Adding progress_type column...')
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'goals' AND column_name = 'progress_type'
          ) THEN
            ALTER TABLE goals ADD COLUMN progress_type TEXT DEFAULT 'manual';
            
            -- Add constraint to ensure valid values
            ALTER TABLE goals ADD CONSTRAINT goals_progress_type_check 
            CHECK (progress_type IN ('manual', 'milestone'));
          END IF;
        END $$;
      `
    })

    if (alterError) {
      console.error('Error adding progress_type column:', alterError)
      throw alterError
    }

    console.log('progress_type column added successfully')

    // Step 2: Migrate existing data
    console.log('Migrating existing goals...')
    
    // Get all goals
    const { data: goals, error: fetchError } = await supabase
      .from('goals')
      .select('id, description, progress_type')

    if (fetchError) {
      console.error('Error fetching goals:', fetchError)
      throw fetchError
    }

    console.log(`Found ${goals.length} goals to migrate`)

    // Update goals based on description markers
    let migratedCount = 0
    for (const goal of goals) {
      let newProgressType = 'manual'
      let cleanDescription = goal.description

      // Check if goal has milestone marker
      if (goal.description && goal.description.includes('[MILESTONE_BASED]')) {
        newProgressType = 'milestone'
        // Clean the description by removing the marker
        cleanDescription = goal.description.replace(/\s*\[MILESTONE_BASED\]/g, '').trim()
        if (cleanDescription === '') {
          cleanDescription = null
        }
      }

      // Update the goal if needed
      if (goal.progress_type !== newProgressType || goal.description !== cleanDescription) {
        const { error: updateError } = await supabase
          .from('goals')
          .update({
            progress_type: newProgressType,
            description: cleanDescription
          })
          .eq('id', goal.id)

        if (updateError) {
          console.error(`Error updating goal ${goal.id}:`, updateError)
        } else {
          migratedCount++
          console.log(`✓ Migrated goal ${goal.id} to ${newProgressType} type`)
        }
      }
    }

    console.log(`Migration completed! ${migratedCount} goals updated.`)

    // Step 3: Verify the migration
    const { data: verifyData, error: verifyError } = await supabase
      .from('goals')
      .select('progress_type, count(*)', { count: 'exact' })

    if (!verifyError && verifyData) {
      const milestoneCount = await supabase
        .from('goals')
        .select('id', { count: 'exact' })
        .eq('progress_type', 'milestone')

      const manualCount = await supabase
        .from('goals')
        .select('id', { count: 'exact' })
        .eq('progress_type', 'manual')

      console.log('\nMigration Summary:')
      console.log(`- Manual goals: ${manualCount.count || 0}`)
      console.log(`- Milestone goals: ${milestoneCount.count || 0}`)
      console.log(`- Total goals: ${goals.length}`)
    }

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
migrateProgressType().then(() => {
  console.log('Migration script completed successfully')
  process.exit(0)
}).catch((error) => {
  console.error('Migration script failed:', error)
  process.exit(1)
})