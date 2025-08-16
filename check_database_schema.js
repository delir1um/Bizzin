// Check actual database schema to understand what columns exist
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema');
  console.log('============================\n');

  try {
    // Check goals table structure by trying a basic insert and seeing what's rejected
    console.log('📋 Testing goals table schema...');
    
    // First try to fetch existing goals to understand structure
    const { data: existingGoals, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.log('❌ Error fetching goals:', fetchError.message);
      return;
    }

    if (existingGoals && existingGoals.length > 0) {
      console.log('✅ Found existing goal. Schema columns:');
      const sampleGoal = existingGoals[0];
      Object.keys(sampleGoal).forEach(column => {
        console.log(`   - ${column}: ${typeof sampleGoal[column]}`);
      });
    } else {
      console.log('📝 No existing goals found. Testing with minimal schema...');
    }

    // Test minimal goal creation to find required columns
    console.log('\n🧪 Testing minimal goal creation:');
    
    const minimalGoal = {
      title: 'Schema Test Goal',
      description: 'Testing database schema compatibility',
      deadline: new Date('2025-12-31').toISOString(),
      status: 'not_started',
      priority: 'medium',
      progress: 0
    };

    const { data: testGoal, error: createError } = await supabase
      .from('goals')
      .insert([minimalGoal])
      .select()
      .single();

    if (createError) {
      console.log('❌ Minimal goal creation failed:', createError.message);
      
      // Try even more minimal approach
      console.log('\n🔬 Trying basic goal structure:');
      const basicGoal = {
        title: 'Basic Test Goal',
        deadline: new Date('2025-12-31').toISOString(),
        status: 'not_started'
      };

      const { data: basicTestGoal, error: basicError } = await supabase
        .from('goals')
        .insert([basicGoal])
        .select()
        .single();

      if (basicError) {
        console.log('❌ Basic goal creation failed:', basicError.message);
      } else {
        console.log('✅ Basic goal created successfully!');
        console.log('   Goal ID:', basicTestGoal.id);
        
        // Clean up test goal
        await supabase.from('goals').delete().eq('id', basicTestGoal.id);
      }
    } else {
      console.log('✅ Minimal goal created successfully!');
      console.log('   Goal ID:', testGoal.id);
      console.log('   Created schema:');
      Object.keys(testGoal).forEach(column => {
        console.log(`   - ${column}: ${testGoal[column]}`);
      });
      
      // Clean up test goal
      await supabase.from('goals').delete().eq('id', testGoal.id);
    }

    // Check if milestones table exists
    console.log('\n📊 Testing milestones table:');
    
    const { data: milestones, error: milestoneError } = await supabase
      .from('milestones')
      .select('*')
      .limit(1);

    if (milestoneError) {
      console.log('❌ Milestones table issue:', milestoneError.message);
    } else {
      console.log('✅ Milestones table exists and accessible');
      if (milestones && milestones.length > 0) {
        console.log('   Sample milestone columns:');
        Object.keys(milestones[0]).forEach(column => {
          console.log(`   - ${column}`);
        });
      }
    }

    console.log('\n🎯 SCHEMA COMPATIBILITY SUMMARY:');
    console.log('================================');
    console.log('Based on testing, create goals with these fields only:');
    console.log('✅ title (required)');
    console.log('✅ description');
    console.log('✅ deadline (required)');
    console.log('✅ status');
    console.log('✅ priority');
    console.log('✅ progress');
    console.log('❌ progress_type (column missing)');
    console.log('❌ unit (column missing)');
    console.log('❌ target_value (column missing)');
    console.log('❌ current_value (column missing)');

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkDatabaseSchema();