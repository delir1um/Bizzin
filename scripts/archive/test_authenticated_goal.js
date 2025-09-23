// Test with actual authenticated user session
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithAuthenticatedUser() {
  console.log('🔐 Testing Goal Creation with Real User Session');
  
  try {
    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ No authenticated user found');
      console.log('Auth error:', authError);
      return;
    }
    
    console.log('✅ Found authenticated user:', user.id);
    console.log('User email:', user.email);
    
    // Test goal creation with authenticated user
    const testGoal = {
      title: 'Test Authenticated Goal',
      description: 'Testing with real authenticated user',
      category: 'Testing',
      priority: 'medium',
      status: 'not_started',
      progress: 0,
      deadline: new Date('2025-12-31').toISOString(),
      user_id: user.id
    };
    
    console.log('\n📝 Creating goal with user:', user.id);
    
    const { data: goalResult, error: goalError } = await supabase
      .from('goals')
      .insert([testGoal])
      .select()
      .single();
      
    if (goalError) {
      console.log('❌ Goal creation failed:', goalError.message);
      console.log('Error code:', goalError.code);
      console.log('Error details:', goalError);
      console.log('Goal data sent:', testGoal);
    } else {
      console.log('✅ Goal created successfully!');
      console.log('Created goal:', goalResult);
      
      // Clean up test goal
      await supabase.from('goals').delete().eq('id', goalResult.id);
      console.log('✅ Test goal cleaned up');
    }
    
    // Test milestone goal creation
    console.log('\n📊 Testing Milestone-based Goal');
    
    const milestoneGoal = {
      title: 'Test Milestone Goal',
      description: 'Testing milestone goal [MILESTONE_BASED]',
      category: 'Business',
      priority: 'high',
      status: 'not_started',
      progress: 0,
      deadline: new Date('2025-12-31').toISOString(),
      user_id: user.id
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
      console.log('✅ Milestone goal created successfully!');
      console.log('Created milestone goal:', milestoneResult);
      
      // Test milestone creation
      console.log('\n🎯 Testing Milestone Creation');
      
      const testMilestone = {
        goal_id: milestoneResult.id,
        title: 'Test Milestone',
        description: 'Testing milestone creation',
        weight: 25,
        order_index: 1,
        completed: false,
        due_date: null,
        user_id: user.id
      };
      
      const { data: milestoneData, error: milestoneCreateError } = await supabase
        .from('milestones')
        .insert([testMilestone])
        .select()
        .single();
        
      if (milestoneCreateError) {
        console.log('❌ Milestone creation failed:', milestoneCreateError.message);
        console.log('Error code:', milestoneCreateError.code);
        if (milestoneCreateError.code === '42P01') {
          console.log('📝 Milestones table does not exist - this is expected');
        }
      } else {
        console.log('✅ Milestone created successfully!');
        await supabase.from('milestones').delete().eq('id', milestoneData.id);
        console.log('✅ Test milestone cleaned up');
      }
      
      // Clean up milestone goal
      await supabase.from('goals').delete().eq('id', milestoneResult.id);
      console.log('✅ Milestone goal cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWithAuthenticatedUser();