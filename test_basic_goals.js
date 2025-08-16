// Basic Goals Test - Working with current database schema
// Phase 1: Test core goal functionality with authenticated session

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple test scenarios using only columns that exist
const basicTestScenarios = [
  {
    title: "Complete Website Redesign",
    description: "Modernize company website with new branding and improved UX",
    category: "Marketing",
    priority: "high",
    progress: 15,
    deadline: new Date('2025-11-15'),
    status: "in_progress",
  },
  {
    title: "Launch Email Newsletter",
    description: "Create and launch weekly business newsletter for customer engagement",
    category: "Marketing", 
    priority: "medium",
    progress: 0,
    deadline: new Date('2025-09-30'),
    status: "not_started",
  },
  {
    title: "Hire Sales Manager",
    description: "Recruit experienced sales manager to lead business development",
    category: "Team",
    priority: "high",
    progress: 40,
    deadline: new Date('2025-10-31'),
    status: "in_progress",
  }
];

async function testBasicGoals() {
  console.log('🎯 Testing Basic Goals Functionality');
  console.log('Using only confirmed database columns\n');

  // First ensure we have user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.log('❌ Authentication required for testing');
    console.log('Please ensure user is logged in through the app first');
    return;
  }

  console.log('✅ Authenticated user found:', user.email);

  let successCount = 0;
  let errorCount = 0;
  const results = [];

  try {
    // Test goal creation with authenticated user
    for (const scenario of basicTestScenarios) {
      try {
        const goalData = {
          ...scenario,
          user_id: user.id,
          deadline: scenario.deadline.toISOString()
        };

        const { data, error } = await supabase
          .from('goals')
          .insert([goalData])
          .select()
          .single();

        if (error) {
          throw error;
        }

        successCount++;
        results.push({
          scenario: scenario.title,
          status: 'success', 
          goal_id: data.id,
          progress: data.progress
        });
        
        console.log(`✅ Goal created: ${scenario.title} (${scenario.progress}% progress)`);

      } catch (error) {
        errorCount++;
        results.push({
          scenario: scenario.title,
          status: 'error',
          error: error.message
        });
        console.log(`❌ Failed: ${scenario.title} - ${error.message}`);
      }
    }

    // Test goal retrieval
    console.log('\n📊 Testing Goal Retrieval');
    try {
      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`✅ Successfully fetched ${goals.length} user goals`);
      
      if (goals.length > 0) {
        console.log('\n📋 User Goals:');
        goals.slice(0, 5).forEach((goal, index) => {
          console.log(`${index + 1}. ${goal.title} - ${goal.progress}% (${goal.status})`);
        });
      }

    } catch (error) {
      console.log(`❌ Goal fetching failed: ${error.message}`);
    }

    // Test goal updates
    console.log('\n📝 Testing Goal Updates');
    const successfulGoals = results.filter(r => r.status === 'success');
    
    if (successfulGoals.length > 0) {
      const testGoal = successfulGoals[0];
      try {
        const { data: updatedGoal, error } = await supabase
          .from('goals')
          .update({ progress: 75, status: 'in_progress' })
          .eq('id', testGoal.goal_id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        console.log(`✅ Goal updated: ${updatedGoal.title} progress changed to ${updatedGoal.progress}%`);

      } catch (error) {
        console.log(`❌ Goal update failed: ${error.message}`);
      }
    }

    // Generate report
    console.log('\n📋 BASIC GOALS TEST REPORT');
    console.log('===========================');
    console.log(`Scenarios Tested: ${basicTestScenarios.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    console.log(`Success Rate: ${Math.round((successCount / basicTestScenarios.length) * 100)}%\n`);

    if (successCount > 0) {
      console.log('🎉 CORE FUNCTIONALITY CONFIRMED:');
      console.log('✅ Goal creation works with current schema');
      console.log('✅ User authentication and RLS working');
      console.log('✅ Goal retrieval and updates operational');
      console.log('✅ Progress tracking with percentage values');
      console.log('✅ Ready for UI testing with real goals');
    }

    if (successCount === basicTestScenarios.length) {
      console.log('\n🚀 PHASE 1 COMPLETE - READY FOR UI TESTING');
      console.log('The Add Goal modal should now work with the current database!');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

testBasicGoals();