// Create milestones table in Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMilestonesTable() {
  console.log('🔧 Creating Milestones Table');
  
  try {
    // First, try to create the milestones table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS milestones (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        weight INTEGER DEFAULT 10,
        order_index INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMPTZ,
        due_date TIMESTAMPTZ,
        status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    const { data: tableResult, error: tableError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });
    
    if (tableError) {
      console.log('❌ Cannot create table via RPC:', tableError.message);
      
      // Try using direct table creation (this may not work with anon key)
      console.log('🔄 Trying alternative approach...');
      
      // Test if table exists by trying to select from it
      const { data: testData, error: testError } = await supabase
        .from('milestones')
        .select('id')
        .limit(1);
        
      if (testError && testError.code === '42P01') {
        console.log('❌ Milestones table does not exist');
        console.log('❌ Cannot create table - need admin access');
        console.log('📝 Manual SQL needed:');
        console.log(createTableSQL);
        
        // Try to create a temporary workaround
        console.log('\n🔄 Creating fallback solution...');
        return false;
      } else if (testError) {
        console.log('❌ Other error accessing milestones:', testError.message);
        return false;
      } else {
        console.log('✅ Milestones table already exists');
        return true;
      }
    } else {
      console.log('✅ Milestones table created successfully');
    }

    // Create RLS policies
    const rlsPolicies = [
      `ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;`,
      `CREATE POLICY "Users can view their own milestones" ON milestones FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can insert their own milestones" ON milestones FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can update their own milestones" ON milestones FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can delete their own milestones" ON milestones FOR DELETE USING (auth.uid() = user_id);`
    ];

    for (const policy of rlsPolicies) {
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: policy
      });
      
      if (policyError) {
        console.log('⚠️ Policy creation error (may already exist):', policyError.message);
      } else {
        console.log('✅ RLS policy created');
      }
    }

    // Test milestone creation
    const testMilestone = {
      goal_id: '00000000-0000-0000-0000-000000000000', // dummy ID for test
      user_id: '9502ea97-1adb-4115-ba05-1b6b1b5fa721',
      title: 'Test Milestone',
      description: 'Testing milestone creation',
      weight: 25,
      order_index: 1
    };

    const { data: milestoneTest, error: milestoneError } = await supabase
      .from('milestones')
      .insert([testMilestone])
      .select()
      .single();

    if (milestoneError) {
      console.log('❌ Test milestone creation failed:', milestoneError.message);
      return false;
    } else {
      console.log('✅ Test milestone created successfully');
      // Clean up test milestone
      await supabase.from('milestones').delete().eq('id', milestoneTest.id);
      console.log('✅ Test milestone cleaned up');
      return true;
    }

  } catch (error) {
    console.error('❌ Table creation failed:', error);
    return false;
  }
}

createMilestonesTable();