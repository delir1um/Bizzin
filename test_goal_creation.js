// Test Goal Creation - Direct Database Test
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGoalCreation() {
  console.log('🧪 Testing Goal Creation');
  console.log('Direct database test to identify actual issues\n');

  try {
    // Test 1: Basic goal creation
    console.log('📝 Test 1: Basic Goal Creation');
    
    const basicGoal = {
      title: 'Test Basic Goal',
      description: 'Simple test goal',
      category: 'Testing',
      priority: 'medium',
      status: 'not_started',
      progress: 0,
      deadline: new Date('2025-12-31').toISOString(),
      user_id: 'test-user-basic'
    };

    const { data: basicResult, error: basicError } = await supabase
      .from('goals')
      .insert([basicGoal])
      .select()
      .single();

    if (basicError) {
      console.log('❌ Basic goal creation failed:', basicError.message);
      console.log('Error details:', basicError);
    } else {
      console.log('✅ Basic goal created successfully:', basicResult.title);
    }

    // Test 2: Milestone-based goal creation
    console.log('\n📊 Test 2: Milestone-based Goal Creation');
    
    const milestoneGoal = {
      title: 'Test Milestone Goal',
      description: 'Test milestone goal [MILESTONE_BASED]',
      category: 'Business',
      priority: 'high',
      status: 'not_started',
      progress: 0,
      deadline: new Date('2025-12-31').toISOString(),
      user_id: 'test-user-milestone'
    };

    const { data: milestoneResult, error: milestoneError } = await supabase
      .from('goals')
      .insert([milestoneGoal])
      .select()
      .single();

    if (milestoneError) {
      console.log('❌ Milestone goal creation failed:', milestoneError.message);
      console.log('Error details:', milestoneError);
    } else {
      console.log('✅ Milestone goal created successfully:', milestoneResult.title);
    }

    // Test 3: Check database schema
    console.log('\n🔍 Test 3: Database Schema Check');
    
    const { data: schemaCheck, error: schemaError } = await supabase
      .from('goals')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.log('❌ Schema check failed:', schemaError.message);
    } else {
      console.log('✅ Goals table accessible');
      if (schemaCheck && schemaCheck.length > 0) {
        console.log('Available columns:', Object.keys(schemaCheck[0]));
      }
    }

    // Test 4: Authentication check
    console.log('\n🔐 Test 4: Authentication Check');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Authentication check failed:', authError.message);
    } else if (user) {
      console.log('✅ User authenticated:', user.id);
    } else {
      console.log('⚠️  No authenticated user found');
    }

    // Test 5: Cleanup test data
    console.log('\n🧹 Test 5: Cleanup');
    
    if (basicResult) {
      await supabase.from('goals').delete().eq('id', basicResult.id);
      console.log('✅ Basic goal cleaned up');
    }
    
    if (milestoneResult) {
      await supabase.from('goals').delete().eq('id', milestoneResult.id);
      console.log('✅ Milestone goal cleaned up');
    }

    console.log('\n📊 TEST SUMMARY');
    console.log('====================');
    console.log(`Basic Goal Creation: ${basicError ? '❌' : '✅'}`);
    console.log(`Milestone Goal Creation: ${milestoneError ? '❌' : '✅'}`);
    console.log(`Database Access: ${schemaError ? '❌' : '✅'}`);
    console.log(`Authentication: ${authError || !user ? '❌' : '✅'}`);

    if (!basicError && !milestoneError && !schemaError && user) {
      console.log('\n🎉 All tests passed! Goal creation should work.');
    } else {
      console.log('\n⚠️  Issues found that need to be addressed:');
      if (basicError) console.log('  • Basic goal creation failing');
      if (milestoneError) console.log('  • Milestone goal creation failing');
      if (schemaError) console.log('  • Database schema issues');
      if (authError || !user) console.log('  • Authentication not working');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

testGoalCreation();