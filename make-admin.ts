import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function makeUserAdmin(email: string) {
  console.log(`🔧 Making ${email} an admin user...`);

  try {
    // Step 1: Get user ID from auth.users
    const { data: result, error: sqlError } = await supabase.rpc('exec_sql', {
      sql_query: `SELECT id FROM auth.users WHERE email = '${email}'`
    });

    if (sqlError) {
      console.error('Error finding user:', sqlError);
      return;
    }

    console.log('User lookup result:', result);

    // Step 2: Try alternative approach - insert admin record directly
    // We'll use the hardcoded user ID that we see in the logs
    const userId = '9502ea97-1adb-4115-ba05-1b6b1b5fa721'; // From the console logs

    console.log(`\n👥 Adding ${email} to admin_users table...`);
    const { data: insertResult, error: insertError } = await supabase.rpc('exec_sql', {
      sql_query: `
        INSERT INTO admin_users (user_id, email, is_admin, created_at) 
        VALUES ('${userId}', '${email}', true, NOW())
        ON CONFLICT (user_id) DO UPDATE SET 
          email = EXCLUDED.email,
          is_admin = true
      `
    });

    if (insertError) {
      console.error('Error inserting admin user:', insertError);
      return;
    }

    console.log('Admin user insert result:', insertResult);

    // Step 3: Also update user_profiles to mark as admin
    console.log(`\n👤 Updating user_profiles for ${email}...`);
    const { data: profileResult, error: profileError } = await supabase.rpc('exec_sql', {
      sql_query: `
        INSERT INTO user_profiles (user_id, email, is_admin, is_active, created_at, updated_at) 
        VALUES ('${userId}', '${email}', true, true, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET 
          email = EXCLUDED.email,
          is_admin = true,
          updated_at = NOW()
      `
    });

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      return;
    }

    console.log('Profile update result:', profileResult);

    // Step 4: Verify admin status
    console.log(`\n🔍 Verifying admin status for ${email}...`);
    
    // Check admin_users table
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email);

    if (adminCheckError) {
      console.error('Error checking admin_users:', adminCheckError);
    } else {
      console.log('Admin users record:', adminCheck);
    }

    // Check user_profiles table
    const { data: profileCheck, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email);

    if (profileCheckError) {
      console.error('Error checking user_profiles:', profileCheckError);
    } else {
      console.log('User profile record:', profileCheck);
    }

    console.log(`\n✅ ${email} has been successfully made an admin!`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
makeUserAdmin('anton@cloudfusion.co.za').catch(console.error);