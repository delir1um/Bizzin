// Check and potentially fix RLS policies for goals table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log('🔒 Checking RLS Policies for Goals Table');
  
  try {
    // Try to check if we can read existing goals (if any)
    const { data: existingGoals, error: readError } = await supabase
      .from('goals')
      .select('id, title, user_id')
      .limit(5);
      
    if (readError) {
      console.log('❌ Cannot read goals:', readError.message);
    } else {
      console.log('✅ Can read goals table');
      console.log(`Found ${existingGoals?.length || 0} existing goals`);
      if (existingGoals && existingGoals.length > 0) {
        console.log('Sample goal:', existingGoals[0]);
      }
    }
    
    // Try to check RLS policies directly (may not work with anon key)
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'goals');
      
    if (policyError) {
      console.log('❌ Cannot read policies:', policyError.message);
    } else {
      console.log('✅ RLS Policies:');
      console.log(policies);
    }
    
    // Check if user profile exists (might be part of RLS policy)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log(`\n👤 User ID: ${user.id}`);
      
      // Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.log('❌ Cannot read user profile:', profileError.message);
        
        // Try to create user profile if it doesn't exist
        console.log('🔄 Attempting to create user profile...');
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            id: user.id,
            email: user.email,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
          
        if (createError) {
          console.log('❌ Cannot create user profile:', createError.message);
        } else {
          console.log('✅ User profile created:', newProfile);
        }
      } else {
        console.log('✅ User profile exists:', profile);
      }
    }
    
    // Test with minimal goal data
    console.log('\n🧪 Testing minimal goal creation...');
    
    const testGoal = {
      title: 'RLS Test Goal',
      description: 'Testing RLS policies',
      status: 'not_started',
      progress: 0,
      deadline: new Date('2025-12-31').toISOString()
      // Note: Not including user_id - let RLS handle it
    };
    
    const { data: createdGoal, error: createError } = await supabase
      .from('goals')
      .insert([testGoal])
      .select()
      .single();
      
    if (createError) {
      console.log('❌ RLS test goal creation failed:', createError.message);
      console.log('Error code:', createError.code);
      
      // Try with explicit user_id
      if (user) {
        console.log('\n🔄 Trying with explicit user_id...');
        const testGoalWithUser = { ...testGoal, user_id: user.id };
        
        const { data: createdGoal2, error: createError2 } = await supabase
          .from('goals')
          .insert([testGoalWithUser])
          .select()
          .single();
          
        if (createError2) {
          console.log('❌ Goal creation with user_id failed:', createError2.message);
        } else {
          console.log('✅ Goal created with explicit user_id!');
          // Clean up
          await supabase.from('goals').delete().eq('id', createdGoal2.id);
          console.log('✅ Test goal cleaned up');
        }
      }
    } else {
      console.log('✅ RLS test goal created successfully!');
      // Clean up
      await supabase.from('goals').delete().eq('id', createdGoal.id);
      console.log('✅ Test goal cleaned up');
    }
    
  } catch (error) {
    console.error('❌ RLS check failed:', error);
  }
}

checkRLSPolicies();