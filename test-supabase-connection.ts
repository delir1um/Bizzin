import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Need VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    // Test 1: Check connection by querying a system table
    console.log('\n🔍 Testing basic connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);

    if (tablesError) {
      console.log('❌ Basic connection failed:', tablesError.message);
    } else {
      console.log('✅ Basic connection successful!');
      console.log('📋 Sample tables:', tables?.map(t => t.table_name));
    }

    // Test 2: Check admin_users table
    console.log('\n👥 Testing admin_users table...');
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);

    if (adminError) {
      console.log('⚠️ admin_users issue:', adminError.message);
      console.log('Code:', adminError.code);
    } else {
      console.log('✅ admin_users accessible');
      console.log('Count:', adminData?.length || 0);
    }

    // Test 3: Check user_profiles table
    console.log('\n👤 Testing user_profiles table...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (profileError) {
      console.log('⚠️ user_profiles issue:', profileError.message);
      console.log('Code:', profileError.code);
    } else {
      console.log('✅ user_profiles accessible');
      console.log('Count:', profileData?.length || 0);
    }

    // Test 4: Test raw SQL execution
    console.log('\n🔧 Testing raw SQL execution...');
    const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: 'SELECT current_database(), current_user'
    });

    if (sqlError) {
      console.log('⚠️ Raw SQL execution failed:', sqlError.message);
    } else {
      console.log('✅ Raw SQL execution successful');
      console.log('Result:', sqlData);
    }

    // Test 5: Check available RPC functions
    console.log('\n🔧 Checking available functions...');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .limit(10);

    if (functionsError) {
      console.log('⚠️ Functions check failed:', functionsError.message);
    } else {
      console.log('✅ Available functions:', functions?.map(f => f.routine_name));
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSupabaseConnection();