import { EmailService } from './EmailService.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side use
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export class SimpleEmailScheduler {
  private emailService: EmailService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.emailService = new EmailService();
  }

  async start() {
    if (this.isRunning) {
      console.log('📧 Email scheduler already running');
      return;
    }

    console.log('🚀 Starting Simple Email Scheduler...');
    
    // Load email templates
    await this.emailService.loadTemplates();
    
    // Check every minute for users who need emails
    this.intervalId = setInterval(() => {
      this.checkAndSendEmails().catch(error => {
        console.error('❌ Error in email check:', error);
      });
    }, 60 * 1000); // Every 60 seconds
    
    this.isRunning = true;
    console.log('✅ Simple Email Scheduler started - checking every minute');
    
    // Run initial check immediately
    this.checkAndSendEmails().catch(error => {
      console.error('❌ Error in initial email check:', error);
    });
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Simple Email Scheduler stopped');
  }

  private async checkAndSendEmails() {
    try {
      // Get current South Africa time (UTC+2)
      const now = new Date();
      const southAfricaTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
      const currentHour = southAfricaTime.getHours();
      const currentMinute = southAfricaTime.getMinutes();
      
      // Only process on exact minute marks to avoid duplicate sends
      if (currentMinute !== 0) {
        return;
      }

      console.log(`⏰ Checking for emails to send at ${currentHour}:00 SA time`);

      // Get all users with daily email settings enabled
      const { data: emailSettings, error } = await supabase
        .from('daily_email_settings')
        .select(`
          user_id,
          send_time,
          enabled,
          timezone,
          content_preferences,
          user_profiles!daily_email_settings_user_id_fkey (
            email,
            name,
            business_type
          )
        `)
        .eq('enabled', true);

      if (error) {
        console.error('❌ Error fetching email settings:', error);
        return;
      }

      if (!emailSettings || emailSettings.length === 0) {
        console.log('📭 No users with email settings enabled');
        return;
      }

      let sentCount = 0;
      let errorCount = 0;

      // Process each user
      for (const setting of emailSettings) {
        try {
          // Parse the user's preferred send time
          const [sendHour, sendMinute] = setting.send_time.split(':').map(Number);
          
          // Check if it's time to send this user's email
          if (currentHour === sendHour) {
            console.log(`📧 Sending email to user ${setting.user_id} at their preferred time ${setting.send_time}`);
            
            // Check if email was already sent today
            const today = southAfricaTime.toISOString().split('T')[0];
            const { data: existingEmail } = await supabase
              .from('email_delivery_log')
              .select('id')
              .eq('user_id', setting.user_id)
              .eq('email_type', 'daily_digest')
              .gte('sent_at', `${today}T00:00:00.000Z`)
              .limit(1);

            if (existingEmail && existingEmail.length > 0) {
              console.log(`⚠️ Email already sent today for user ${setting.user_id}`);
              continue;
            }

            // Send the email
            const userProfile = Array.isArray(setting.user_profiles) ? setting.user_profiles[0] : setting.user_profiles;
            const result = await this.emailService.sendDailyEmail(
              setting.user_id,
              {
                profile: {
                  name: userProfile?.name || 'Entrepreneur',
                  business_type: userProfile?.business_type || 'Business',
                  email: userProfile?.email || '',
                  user_id: setting.user_id
                }
              }
            );

            if (result) {
              // Log successful delivery
              await supabase
                .from('email_delivery_log')
                .insert({
                  user_id: setting.user_id,
                  email_type: 'daily_digest',
                  email_address: userProfile?.email,
                  sent_at: new Date().toISOString(),
                  status: 'sent'
                });

              sentCount++;
              console.log(`✅ Email sent successfully to ${userProfile?.email}`);
            } else {
              errorCount++;
              console.error(`❌ Failed to send email to ${userProfile?.email}`);
              
              // Log failed delivery
              await supabase
                .from('email_delivery_log')
                .insert({
                  user_id: setting.user_id,
                  email_type: 'daily_digest',
                  email_address: userProfile?.email,
                  sent_at: new Date().toISOString(),
                  status: 'failed',
                  error_message: 'Email send failed'
                });
            }
          }
        } catch (userError) {
          errorCount++;
          console.error(`❌ Error processing user ${setting.user_id}:`, userError);
        }
      }

      if (sentCount > 0 || errorCount > 0) {
        console.log(`📊 Email batch complete: ${sentCount} sent, ${errorCount} errors`);
      }

    } catch (error) {
      console.error('❌ Critical error in email scheduler:', error);
    }
  }

  // Manual trigger for testing
  async sendTestEmail(userId: string): Promise<boolean> {
    try {
      console.log(`🧪 Manually sending test email for user ${userId}`);
      
      // Get user email settings
      const { data: setting, error } = await supabase
        .from('daily_email_settings')
        .select(`
          user_id,
          user_profiles!daily_email_settings_user_id_fkey (
            email,
            name,
            business_type
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error || !setting) {
        console.error('❌ User not found or no email settings:', error);
        return false;
      }

      const userProfile = Array.isArray(setting.user_profiles) ? setting.user_profiles[0] : setting.user_profiles;
      const result = await this.emailService.sendDailyEmail(
        userId,
        {
          profile: {
            name: userProfile?.name || 'Entrepreneur',
            business_type: userProfile?.business_type || 'Business',
            email: userProfile?.email || '',
            user_id: userId
          }
        }
      );

      if (result) {
        console.log(`✅ Test email sent successfully to ${userProfile?.email}`);
        return true;
      } else {
        console.error(`❌ Test email failed`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending test email:', error);
      return false;
    }
  }

  getStatus() {
    return {
      running: this.isRunning,
      next_check: this.isRunning ? 'Every minute on the hour' : 'Not scheduled'
    };
  }
}

// Export singleton instance
export const simpleEmailScheduler = new SimpleEmailScheduler();