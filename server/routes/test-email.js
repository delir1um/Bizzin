// Test endpoint for the daily email system
import { DailyEmailScheduler } from '../services/DailyEmailScheduler.js';

const scheduler = new DailyEmailScheduler();

async function testEmailSystem() {
  console.log('🧪 Testing Daily Email System...\n');

  try {
    // Initialize the scheduler
    await scheduler.initialize();
    console.log('✅ Email scheduler initialized successfully');

    // Get sample user from database to test with
    const { supabase } = await import('../lib/supabase.js');
    
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error || !users?.users?.length) {
      console.log('⚠️  No users found for testing. Create a user account first.');
      return;
    }

    const testUser = users.users[0];
    console.log(`📧 Testing with user: ${testUser.email}`);

    // Create test email settings for this user
    const { data: settings, error: settingsError } = await supabase
      .from('daily_email_settings')
      .upsert({
        user_id: testUser.id,
        enabled: true,
        send_time: '12:00', // Current time for immediate testing
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

    // Send test email
    console.log('📬 Sending test email...');
    const success = await scheduler.sendTestEmail(testUser.id);

    if (success) {
      console.log('✅ Test email sent successfully!');
      console.log(`Check inbox: ${testUser.email}`);
      
      // Get analytics
      const analytics = await scheduler.getEmailAnalytics(1);
      console.log('\n📊 Email Analytics:');
      console.log(`Total sent: ${analytics?.totalSent || 0}`);
      console.log(`Open rate: ${analytics?.openRate?.toFixed(1) || 0}%`);
      
    } else {
      console.log('❌ Test email failed - check SMTP configuration');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEmailSystem();