// Test simple goal creation with minimal data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleGoal() {
  console.log('🧪 Testing Simple Goal Creation');
  
  try {
    // Test with a real user ID that we know exists (from the logs)
    const knownUserId = '9502ea97-1adb-4115-ba05-1b6b1b5fa721';
    
    const simpleGoal = {
      title: 'Test Simple Goal',
      description: 'Testing minimal goal creation',
      priority: 'medium',
      status: 'not_started',
      progress: 0,
      deadline: new Date('2025-12-31').toISOString(),
      user_id: knownUserId
    };
    
    console.log('Testing with user ID:', knownUserId);
    console.log('Goal data:', simpleGoal);
    
    const { data, error } = await supabase
      .from('goals')
      .insert([simpleGoal])
      .select()
      .single();
      
    if (error) {
      console.log('❌ Goal creation failed');
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      console.log('Error details:', error.details);
      console.log('Error hint:', error.hint);
      console.log('Full error:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Goal created successfully!');
      console.log('Created goal ID:', data.id);
      
      // Clean up
      await supabase.from('goals').delete().eq('id', data.id);
      console.log('✅ Cleaned up test goal');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleGoal();