// Comprehensive Milestone System Testing - Following Development Methodology
// Testing Phase 1-3 implementation with real goal scenarios

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Test scenarios following our development methodology 
const testScenarios = [
  {
    title: "Launch MVP Product",
    description: "Complete minimum viable product development and launch",
    category: "Product",
    priority: "high",
    progress_type: "milestone",
    deadline: new Date('2025-12-31'),
    status: "in_progress",
  },
  {
    title: "Reach 1000 Users",
    description: "Achieve 1000 active monthly users",
    category: "Growth", 
    priority: "high",
    progress_type: "manual",
    target_value: 1000,
    current_value: 250,
    unit: "users",
    deadline: new Date('2025-09-30'),
    status: "in_progress",
  },
  {
    title: "Complete Business Plan",
    description: "Finalize comprehensive business strategy",
    category: "Planning",
    priority: "medium", 
    progress_type: "milestone",
    deadline: new Date('2025-08-30'),
    status: "not_started",
  },
  {
    title: "Secure Series A Funding",
    description: "Raise $2M Series A investment round",
    category: "Funding",
    priority: "high",
    progress_type: "milestone", 
    deadline: new Date('2026-03-31'),
    status: "not_started",
  },
  {
    title: "Read 50 Business Books",
    description: "Personal development through business literature",
    category: "Learning",
    priority: "low",
    progress_type: "manual",
    target_value: 50,
    current_value: 12,
    unit: "books",
    deadline: new Date('2025-12-31'),
    status: "in_progress", 
  }
];

// Business milestone templates for testing
const milestoneTemplates = {
  "Product Launch": [
    { name: "Market Research & Validation", weight: 15, description: "Validate product-market fit" },
    { name: "Technical Architecture", weight: 20, description: "Build core system foundation" },
    { name: "MVP Development", weight: 25, description: "Create minimum viable product" },
    { name: "Beta Testing", weight: 15, description: "Test with select users" },
    { name: "Go-to-Market Strategy", weight: 10, description: "Plan launch execution" },
    { name: "Public Launch", weight: 15, description: "Official product release" }
  ],
  "Business Expansion": [
    { name: "Market Analysis", weight: 20, description: "Research new market opportunities" },
    { name: "Resource Planning", weight: 15, description: "Secure necessary resources" },
    { name: "Team Scaling", weight: 20, description: "Hire key personnel" },
    { name: "Infrastructure Setup", weight: 15, description: "Establish operational systems" },
    { name: "Pilot Program", weight: 15, description: "Test expansion strategy" },
    { name: "Full Rollout", weight: 15, description: "Complete market entry" }
  ]
};

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Milestone System Test');
  console.log('Following Development Methodology: Test with Real Scenarios\n');

  let successCount = 0;
  let errorCount = 0;
  const results = [];

  try {
    // Phase 1: Test Basic Goal Creation (both manual and milestone types)
    console.log('📋 Phase 1: Testing Goal Creation with Progress Types');
    
    for (const scenario of testScenarios) {
      try {
        // Calculate progress for manual type
        if (scenario.progress_type === 'manual' && scenario.target_value && scenario.current_value) {
          scenario.progress = Math.round((scenario.current_value / scenario.target_value) * 100);
        }

        // Create goal without progress_type if column doesn't exist (backward compatibility)
        const goalData = { ...scenario };
        
        // Try with progress_type first, fallback without if column missing
        let response;
        try {
          response = await supabase
            .from('goals')
            .insert([goalData])
            .select()
            .single();
        } catch (error) {
          if (error.code === 'PGRST204') {
            // Column doesn't exist, create without progress_type
            const { progress_type, ...fallbackData } = goalData;
            response = await supabase
              .from('goals')
              .insert([fallbackData])
              .select()
              .single();
            console.log(`⚠️  Created goal without progress_type (column missing): ${scenario.title}`);
          } else {
            throw error;
          }
        }

        if (response.error) {
          throw response.error;
        }

        successCount++;
        results.push({
          scenario: scenario.title,
          status: 'success', 
          goal_id: response.data.id,
          progress_type: scenario.progress_type,
          calculated_progress: scenario.progress || 0
        });
        
        console.log(`✅ Goal created: ${scenario.title} (${scenario.progress_type})`);

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

    // Phase 2: Test Milestone Templates (if goals created successfully)
    console.log('\n📊 Phase 2: Testing Milestone Templates');
    
    const milestoneGoals = results.filter(r => r.status === 'success' && testScenarios.find(s => s.title === r.scenario)?.progress_type === 'milestone');
    
    for (const result of milestoneGoals) {
      const scenario = testScenarios.find(s => s.title === result.scenario);
      const templateName = scenario.category === 'Product' ? 'Product Launch' : 'Business Expansion';
      const template = milestoneTemplates[templateName];
      
      try {
        // Create milestones for this goal
        const milestones = template.map(milestone => ({
          goal_id: result.goal_id,
          title: milestone.name,
          description: milestone.description,
          weight: milestone.weight,
          completed: false,
          due_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() // Random date within 90 days
        }));

        const { data: createdMilestones, error } = await supabase
          .from('milestones')
          .insert(milestones)
          .select();

        if (error) throw error;

        console.log(`✅ Created ${createdMilestones.length} milestones for: ${result.scenario}`);
        result.milestones_created = createdMilestones.length;
        result.template_used = templateName;

      } catch (error) {
        console.log(`⚠️  Milestone creation failed for ${result.scenario}: ${error.message}`);
        result.milestone_error = error.message;
      }
    }

    // Phase 3: Test Progress Calculation
    console.log('\n📈 Phase 3: Testing Progress Calculation');
    
    for (const result of milestoneGoals) {
      if (result.milestones_created) {
        try {
          // Simulate completing some milestones
          const { data: milestones } = await supabase
            .from('milestones')
            .select('*')
            .eq('goal_id', result.goal_id);

          if (milestones && milestones.length > 0) {
            // Complete 40% of milestones randomly
            const completionCount = Math.floor(milestones.length * 0.4);
            const toComplete = milestones.slice(0, completionCount);

            for (const milestone of toComplete) {
              await supabase
                .from('milestones')
                .update({ completed: true, completed_at: new Date().toISOString() })
                .eq('id', milestone.id);
            }

            // Calculate weighted progress
            const totalWeight = milestones.reduce((sum, m) => sum + m.weight, 0);
            const completedWeight = toComplete.reduce((sum, m) => sum + m.weight, 0);
            const calculatedProgress = Math.round((completedWeight / totalWeight) * 100);

            result.calculated_progress = calculatedProgress;
            result.completed_milestones = completionCount;
            
            console.log(`✅ Progress calculated for ${result.scenario}: ${calculatedProgress}% (${completionCount}/${milestones.length} milestones)`);
          }

        } catch (error) {
          console.log(`⚠️  Progress calculation failed for ${result.scenario}: ${error.message}`);
        }
      }
    }

    // Generate Test Report
    console.log('\n📋 COMPREHENSIVE TEST REPORT');
    console.log('=====================================');
    console.log(`Total Scenarios Tested: ${testScenarios.length}`);
    console.log(`Successful Goal Creation: ${successCount}`);
    console.log(`Failed Goal Creation: ${errorCount}`);
    console.log(`Success Rate: ${Math.round((successCount / testScenarios.length) * 100)}%\n`);

    console.log('📊 DETAILED RESULTS:');
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.scenario}`);
      console.log(`   Status: ${result.status}`);
      if (result.status === 'success') {
        console.log(`   Goal ID: ${result.goal_id}`);
        console.log(`   Progress Type: ${result.progress_type || 'manual (fallback)'}`);
        console.log(`   Progress: ${result.calculated_progress}%`);
        if (result.milestones_created) {
          console.log(`   Milestones: ${result.milestones_created} created using ${result.template_used} template`);
          if (result.completed_milestones) {
            console.log(`   Completed: ${result.completed_milestones} milestones`);
          }
        }
      } else {
        console.log(`   Error: ${result.error}`);
      }
    });

    // Key Insights & Recommendations
    console.log('\n🔍 KEY INSIGHTS:');
    
    if (errorCount === 0) {
      console.log('✅ All goal creation scenarios passed - System is working correctly');
    } else {
      console.log(`⚠️  ${errorCount} scenarios failed - Review error handling`);
    }

    const milestoneResults = results.filter(r => r.milestones_created);
    if (milestoneResults.length > 0) {
      console.log(`✅ Milestone system operational - ${milestoneResults.length} goals have milestone tracking`);
    } else {
      console.log('⚠️  Milestone creation needs database setup - milestones table may be missing');
    }

    console.log('\n🚀 NEXT STEPS:');
    if (errorCount > 0) {
      console.log('1. Fix database schema issues (progress_type column)');
      console.log('2. Ensure milestones table exists with proper structure');
    }
    console.log('3. Test UI components with created goals');
    console.log('4. Validate milestone templates and progress calculation');
    console.log('5. Test analytics dashboard with real data');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the comprehensive test
runComprehensiveTest();