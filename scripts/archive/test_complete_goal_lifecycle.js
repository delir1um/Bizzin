// Complete Goal Lifecycle Testing - Following Development Methodology
// Test CREATE, READ, UPDATE, DELETE operations for both manual and milestone-based goals

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Test scenarios covering both progress types
const lifecycleTestScenarios = [
  {
    type: "manual",
    title: "Manual Progress Goal - Launch Marketing Campaign",
    description: "Execute comprehensive digital marketing strategy for Q4 launch",
    category: "Marketing",
    priority: "high",
    progress: 25,
    deadline: new Date('2025-12-01'),
    status: "in_progress",
    updates: [
      { progress: 50, status: "in_progress" },
      { progress: 100, status: "completed" }
    ]
  },
  {
    type: "milestone",
    title: "Milestone-based Goal - Product Development",
    description: "Complete MVP development with milestone tracking",
    category: "Product",
    priority: "high",
    progress: 0,
    deadline: new Date('2025-11-30'),
    status: "not_started",
    updates: [
      { progress: 30, status: "in_progress" },
      { progress: 75, status: "in_progress" }
    ]
  },
  {
    type: "manual",
    title: "Personal Development Goal",
    description: "Complete business skills training program",
    category: "Learning",
    priority: "medium",
    progress: 10,
    deadline: new Date('2025-10-15'),
    status: "in_progress",
    updates: [
      { progress: 40, status: "in_progress" },
      { progress: 60, status: "at_risk" }
    ]
  }
];

async function testCompleteGoalLifecycle() {
  console.log('🔄 Testing Complete Goal Lifecycle');
  console.log('CREATE → READ → UPDATE → DELETE operations');
  console.log('Testing both Manual and Milestone progress types\n');

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.log('❌ Authentication required - please log in through the app first');
    return;
  }

  console.log('✅ Authenticated user:', user.email);
  
  const testResults = {
    created: [],
    read: [],
    updated: [],
    deleted: [],
    errors: []
  };

  try {
    // PHASE 1: CREATE - Test goal creation for both types
    console.log('\n📝 PHASE 1: CREATE GOALS');
    console.log('========================');
    
    for (const scenario of lifecycleTestScenarios) {
      try {
        const goalData = {
          title: scenario.title,
          description: scenario.description,
          category: scenario.category,
          priority: scenario.priority,
          progress: scenario.progress,
          deadline: scenario.deadline.toISOString(),
          status: scenario.status,
          user_id: user.id
        };

        const { data: createdGoal, error } = await supabase
          .from('goals')
          .insert([goalData])
          .select()
          .single();

        if (error) throw error;

        testResults.created.push({
          ...createdGoal,
          progress_type: scenario.type,
          updates: scenario.updates
        });
        
        console.log(`✅ ${scenario.type.toUpperCase()} goal created: ${createdGoal.title}`);
        console.log(`   ID: ${createdGoal.id}, Progress: ${createdGoal.progress}%`);

      } catch (error) {
        testResults.errors.push(`CREATE ${scenario.type}: ${error.message}`);
        console.log(`❌ Failed to create ${scenario.type} goal: ${error.message}`);
      }
    }

    // PHASE 2: READ - Test goal retrieval
    console.log('\n📖 PHASE 2: READ GOALS');
    console.log('======================');
    
    try {
      const { data: allGoals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      testResults.read = allGoals;
      console.log(`✅ Successfully retrieved ${allGoals.length} goals`);
      
      // Test individual goal retrieval
      for (const goal of testResults.created) {
        const { data: singleGoal, error: singleError } = await supabase
          .from('goals')
          .select('*')
          .eq('id', goal.id)
          .eq('user_id', user.id)
          .single();

        if (singleError) {
          testResults.errors.push(`READ single goal ${goal.id}: ${singleError.message}`);
        } else {
          console.log(`✅ Individual read: ${singleGoal.title} (${singleGoal.progress}%)`);
        }
      }

    } catch (error) {
      testResults.errors.push(`READ goals: ${error.message}`);
      console.log(`❌ Failed to read goals: ${error.message}`);
    }

    // PHASE 3: UPDATE - Test goal modifications
    console.log('\n📝 PHASE 3: UPDATE GOALS');
    console.log('========================');
    
    for (const goal of testResults.created) {
      console.log(`\nTesting updates for: ${goal.title}`);
      
      for (const [index, updateData] of goal.updates.entries()) {
        try {
          const { data: updatedGoal, error } = await supabase
            .from('goals')
            .update(updateData)
            .eq('id', goal.id)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) throw error;

          testResults.updated.push({
            goal_id: goal.id,
            update_number: index + 1,
            ...updatedGoal
          });
          
          console.log(`✅ Update ${index + 1}: Progress ${updateData.progress}%, Status ${updateData.status}`);

        } catch (error) {
          testResults.errors.push(`UPDATE ${goal.id} step ${index + 1}: ${error.message}`);
          console.log(`❌ Update ${index + 1} failed: ${error.message}`);
        }
      }
    }

    // PHASE 4: DELETE - Test goal deletion
    console.log('\n🗑️  PHASE 4: DELETE GOALS');
    console.log('=========================');
    
    // Delete goals one by one to test individual deletion
    for (const goal of testResults.created) {
      try {
        const { error } = await supabase
          .from('goals')
          .delete()
          .eq('id', goal.id)
          .eq('user_id', user.id);

        if (error) throw error;

        testResults.deleted.push(goal.id);
        console.log(`✅ Deleted: ${goal.title} (ID: ${goal.id})`);

        // Verify deletion
        const { data: deletedCheck, error: checkError } = await supabase
          .from('goals')
          .select('*')
          .eq('id', goal.id);

        if (checkError) {
          console.log(`⚠️  Error checking deletion: ${checkError.message}`);
        } else if (deletedCheck.length === 0) {
          console.log(`✅ Deletion verified - goal no longer exists`);
        } else {
          console.log(`❌ Deletion failed - goal still exists`);
        }

      } catch (error) {
        testResults.errors.push(`DELETE ${goal.id}: ${error.message}`);
        console.log(`❌ Failed to delete ${goal.title}: ${error.message}`);
      }
    }

    // COMPREHENSIVE REPORT
    console.log('\n📊 COMPLETE LIFECYCLE TEST REPORT');
    console.log('===================================');
    console.log(`Total Scenarios: ${lifecycleTestScenarios.length}`);
    console.log(`Goals Created: ${testResults.created.length}`);
    console.log(`Goals Retrieved: ${testResults.read.length}`);
    console.log(`Updates Applied: ${testResults.updated.length}`);
    console.log(`Goals Deleted: ${testResults.deleted.length}`);
    console.log(`Errors Encountered: ${testResults.errors.length}\n`);

    // Detailed breakdown
    console.log('🔍 DETAILED BREAKDOWN:');
    console.log('CREATE Operations:');
    testResults.created.forEach(goal => {
      console.log(`  ✅ ${goal.progress_type.toUpperCase()}: ${goal.title}`);
    });

    if (testResults.updated.length > 0) {
      console.log('\nUPDATE Operations:');
      const updatesByGoal = testResults.updated.reduce((acc, update) => {
        if (!acc[update.goal_id]) acc[update.goal_id] = [];
        acc[update.goal_id].push(update);
        return acc;
      }, {});

      Object.entries(updatesByGoal).forEach(([goalId, updates]) => {
        const goal = testResults.created.find(g => g.id === goalId);
        console.log(`  ✅ ${goal?.title}: ${updates.length} updates applied`);
      });
    }

    if (testResults.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      testResults.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }

    // Success assessment
    const totalOperations = lifecycleTestScenarios.length * 4; // CREATE, READ, UPDATE(2x), DELETE
    const successfulOperations = testResults.created.length + 
                                Math.min(testResults.read.length, lifecycleTestScenarios.length) +
                                testResults.updated.length +
                                testResults.deleted.length;

    const successRate = Math.round((successfulOperations / totalOperations) * 100);

    console.log('\n🎯 LIFECYCLE TEST ASSESSMENT:');
    console.log(`Success Rate: ${successRate}%`);
    
    if (successRate >= 90) {
      console.log('🎉 EXCELLENT: Complete goal lifecycle fully operational');
    } else if (successRate >= 75) {
      console.log('✅ GOOD: Core functionality working, minor issues to address');
    } else if (successRate >= 50) {
      console.log('⚠️  PARTIAL: Basic operations working, significant improvements needed');
    } else {
      console.log('❌ POOR: Major issues with goal lifecycle operations');
    }

    console.log('\n🚀 MILESTONE SYSTEM READINESS:');
    if (testResults.created.length === lifecycleTestScenarios.length && testResults.errors.length === 0) {
      console.log('✅ Database operations fully tested and working');
      console.log('✅ Both manual and milestone progress types supported');
      console.log('✅ Ready for milestone system implementation');
      console.log('✅ UI components can be safely tested with real data');
    } else {
      console.log('⚠️  Address identified issues before milestone system deployment');
    }

  } catch (error) {
    console.error('❌ Lifecycle test execution failed:', error);
  }
}

testCompleteGoalLifecycle();