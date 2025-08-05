import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAdminUser(email: string) {
  console.log(`🔧 Adding ${email} as admin user...`);

  try {
    // First, get the user ID from auth.users by email
    const { data: result, error: sqlError } = await supabase.rpc('exec_sql', {
      sql_query: `SELECT id FROM auth.users WHERE email = '${email}'`
    });

    if (sqlError) {
      console.error('Error finding user:', sqlError);
      return;
    }

    console.log('User lookup result:', result);

    // For now, we'll need to get the user ID manually from the auth.users table
    console.log(`Please provide the user ID for ${email}`);
    console.log('You can find it by:');
    console.log('1. Going to Supabase Dashboard > Authentication > Users');
    console.log('2. Finding the user and copying their ID');
    console.log('3. Or run: SELECT id FROM auth.users WHERE email = \'${email}\';');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function removeAdminUser(email: string) {
  console.log(`🔧 Removing admin privileges from ${email}...`);

  try {
    // Remove from admin_users table
    const { data: removeResult, error: removeError } = await supabase.rpc('exec_sql', {
      sql_query: `DELETE FROM admin_users WHERE email = '${email}'`
    });

    if (removeError) {
      console.error('Error removing from admin_users:', removeError);
    } else {
      console.log('Removed from admin_users:', removeResult);
    }

    // Update user_profiles table
    const { data: updateResult, error: updateError } = await supabase.rpc('exec_sql', {
      sql_query: `UPDATE user_profiles SET is_admin = false WHERE email = '${email}'`
    });

    if (updateError) {
      console.error('Error updating user_profiles:', updateError);
    } else {
      console.log('Updated user_profiles:', updateResult);
    }

    console.log(`✅ Admin privileges removed from ${email}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function listAdminUsers() {
  console.log('📋 Listing all admin users...');

  try {
    // Check admin_users table
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*');

    if (adminError) {
      console.error('Error fetching admin_users:', adminError);
    } else {
      console.log('\n👥 Admin Users Table:');
      if (adminUsers && adminUsers.length > 0) {
        adminUsers.forEach((admin, index) => {
          console.log(`${index + 1}. ${admin.email} (User ID: ${admin.user_id})`);
        });
      } else {
        console.log('No admin users found in admin_users table');
      }
    }

    // Check user_profiles table
    const { data: profileAdmins, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('is_admin', true);

    if (profileError) {
      console.error('Error fetching profile admins:', profileError);
    } else {
      console.log('\n👤 User Profiles with Admin Flag:');
      if (profileAdmins && profileAdmins.length > 0) {
        profileAdmins.forEach((admin, index) => {
          console.log(`${index + 1}. ${admin.email} (User ID: ${admin.user_id})`);
        });
      } else {
        console.log('No admin users found in user_profiles table');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function addAdminWithUserId(email: string, userId: string) {
  console.log(`🔧 Adding ${email} (${userId}) as admin user...`);

  try {
    // Add to admin_users table
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

    // Also update user_profiles to mark as admin
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
    console.log(`✅ ${email} has been successfully made an admin!`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function main() {
  const command = process.argv[2];
  const email = process.argv[3];
  const userId = process.argv[4];

  console.log('🔧 Admin User Manager');

  switch (command) {
    case 'list':
      await listAdminUsers();
      break;

    case 'add':
      if (!email) {
        console.log('Usage: tsx admin-user-manager.ts add <email>');
        break;
      }
      await addAdminUser(email);
      break;

    case 'add-with-id':
      if (!email || !userId) {
        console.log('Usage: tsx admin-user-manager.ts add-with-id <email> <user-id>');
        break;
      }
      await addAdminWithUserId(email, userId);
      break;

    case 'remove':
      if (!email) {
        console.log('Usage: tsx admin-user-manager.ts remove <email>');
        break;
      }
      await removeAdminUser(email);
      break;

    default:
      console.log('\nAvailable commands:');
      console.log('- list: List all admin users');
      console.log('- add <email>: Add admin user (requires manual user ID lookup)');
      console.log('- add-with-id <user-id> <email>: Add admin user with known ID');
      console.log('- remove <email>: Remove admin privileges');
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}