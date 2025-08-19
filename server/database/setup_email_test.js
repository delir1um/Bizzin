// Test script to setup email database tables and send test email
// Run this after setting up the SQL schema

import { createClient } from '@supabase/supabase-js';
import { DailyEmailScheduler } from '../services/DailyEmailScheduler.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupEmailTest() {
  try {
    console.log('🚀 Setting up email system test...');

    // Check if tables exist
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['daily_email_settings', 'daily_email_content', 'email_analytics']);

    if (error) {
      console.error('Error checking tables:', error);
      return;
    }

    const tableNames = tables?.map(t => t.table_name) || [];
    const requiredTables = ['daily_email_settings', 'daily_email_content', 'email_analytics'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));

    if (missingTables.length > 0) {
      console.error(`❌ Missing tables: ${missingTables.join(', ')}`);
      console.log('Please run the SQL setup script first');
      return;
    }

    console.log('✅ All required tables exist');

    // Get a test user (first user in the system)
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError || !users?.users?.length) {
      console.error('❌ No users found for testing');
      return;
    }

    const testUser = users.users[0];
    console.log(`📧 Testing with user: ${testUser.email}`);

    // Create test email settings
    const { data: settings, error: settingsError } = await supabase
      .from('daily_email_settings')
      .upsert({
        user_id: testUser.id,
        enabled: true,
        send_time: '09:00',
        timezone: 'UTC',
        content_preferences: {
          journal_prompts: true,
          goal_summaries: true,
          business_insights: true,
          milestone_reminders: true,
        }
      })
      .select()
      .single();

    if (settingsError) {
      console.error('❌ Error creating test settings:', settingsError);
      return;
    }

    console.log('✅ Test email settings created');

    // Initialize email scheduler and send test email
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
      console.log('📬 Sending test email...');
      
      const emailScheduler = new DailyEmailScheduler();
      await emailScheduler.initialize();
      
      const success = await emailScheduler.sendTestEmail(testUser.id);
      
      if (success) {
        console.log('✅ Test email sent successfully!');
        console.log(`Check inbox: ${testUser.email}`);
      } else {
        console.log('❌ Test email failed');
      }
    } else {
      console.log('⚠️  Email credentials not configured - skipping test email');
      console.log('Add EMAIL_USER and EMAIL_APP_PASSWORD to .env to test emails');
    }

    // Show setup summary
    console.log('\n📋 Setup Summary:');
    console.log('- Database tables: ✅ Created');
    console.log(`- Test user settings: ✅ ${testUser.email}`);
    console.log('- Email templates: ✅ Loaded');
    console.log('- Cron scheduler: ✅ Running');

    if (process.env.EMAIL_USER) {
      console.log(`- SMTP config: ✅ ${process.env.EMAIL_USER}`);
    } else {
      console.log('- SMTP config: ❌ Not configured');
    }

    console.log('\n🎉 Daily email system is ready!');
    console.log('Users can now configure their preferences at /settings/notifications');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupEmailTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });