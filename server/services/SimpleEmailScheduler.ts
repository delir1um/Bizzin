import { EmailService } from './EmailService.js';
import { supabase } from '../lib/supabase.js';
import * as cron from 'node-cron';

export class SimpleEmailScheduler {
  public emailService: EmailService;
  private cronTask: cron.ScheduledTask | null = null;
  private isRunning = false;
  private currentlyProcessing = false;

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
    
    // Run at the top of every hour (0 minutes)
    this.cronTask = cron.schedule('0 * * * *', () => {
      this.checkAndSendEmails().catch(error => {
        console.error('❌ Error in email check:', error);
      });
    });
    
    this.isRunning = true;
    console.log('✅ Simple Email Scheduler started - running hourly at :00 minutes (Africa/Johannesburg timezone)');
    
    // Run initial check immediately
    this.checkAndSendEmails().catch(error => {
      console.error('❌ Error in initial email check:', error);
    });
  }

  stop() {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask.destroy();
      this.cronTask = null;
    }
    this.isRunning = false;
    this.currentlyProcessing = false;
    console.log('🛑 Simple Email Scheduler stopped');
  }

  private async checkAndSendEmails() {
    // Prevent concurrent processing
    if (this.currentlyProcessing) {
      console.log('⚠️ Email processing already in progress, skipping this run');
      return;
    }

    this.currentlyProcessing = true;
    
    try {
      // Get current time in South Africa timezone
      const now = new Date();
      const southAfricaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' }));
      const currentHour = southAfricaTime.getHours();
      
      // Extra safety: ensure we're at the top of the hour
      const currentMinute = southAfricaTime.getMinutes();
      if (currentMinute > 5) {
        console.log(`⚠️ Not at top of hour (${currentMinute} minutes past), skipping to prevent duplicates`);
        return;
      }

      console.log(`⏰ Processing emails for ${currentHour}:00 SA time (minute: ${currentMinute})`);

      // Only query users scheduled for THIS hour
      const currentTimeSlot = `${currentHour.toString().padStart(2, '0')}:00`;
      const { data: emailSettings, error } = await supabase
        .from('daily_email_settings')
        .select('user_id, send_time, enabled, timezone, content_preferences')
        .eq('enabled', true)
        .eq('send_time', currentTimeSlot);

      if (error) {
        console.error('❌ Error fetching email settings:', error);
        return;
      }

      if (!emailSettings || emailSettings.length === 0) {
        console.log(`📭 No users scheduled for ${currentTimeSlot}`);
        return;
      }

      console.log(`📊 Processing ${emailSettings.length} users scheduled for ${currentTimeSlot}`);
      
      // BATCH PROCESSING: Process emails in parallel batches for scalability
      const BATCH_SIZE = 20; // Process 20 emails simultaneously
      const batches = this.chunkArray(emailSettings, BATCH_SIZE);
      
      let totalSent = 0;
      let totalErrors = 0;
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} users)`);
        
        const batchResults = await Promise.allSettled(
          batch.map(setting => this.processSingleUser(setting, southAfricaTime))
        );
        
        // Count results
        const batchStats = batchResults.reduce((stats, result) => {
          if (result.status === 'fulfilled') {
            if (result.value.success) {
              stats.sent++;
            } else {
              stats.errors++;
            }
          } else {
            stats.errors++;
            console.error('❌ Batch processing error:', result.reason);
          }
          return stats;
        }, { sent: 0, errors: 0 });
        
        totalSent += batchStats.sent;
        totalErrors += batchStats.errors;
        
        console.log(`📈 Batch ${i + 1} complete: ${batchStats.sent} sent, ${batchStats.errors} errors`);
        
        // Small delay between batches to prevent overwhelming email service
        if (i < batches.length - 1) {
          await this.delay(1000); // 1 second delay between batches
        }
      }

      console.log(`📊 All batches complete: ${totalSent} sent, ${totalErrors} errors`);

    } catch (error) {
      console.error('❌ Critical error in email scheduler:', error);
    } finally {
      this.currentlyProcessing = false;
    }
  }

  // Manual trigger for testing
  async sendTestEmail(userId: string): Promise<boolean> {
    try {
      console.log(`🧪 Manually sending test email for user ${userId}`);
      
      // Get user email settings and profile separately
      const { data: setting, error } = await supabase
        .from('daily_email_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is acceptable
        console.error('❌ Database error getting email settings:', error);
        return false;
      }

      if (!setting) {
        console.error('❌ No email settings found for user:', userId);
        return false;
      }

      // Get user profile from the debug endpoint method which we know works
      // Use Supabase auth admin to get user data 
      let profileData = {
        email: 'anton@cloudfusion.co.za', // fallback for testing
        full_name: 'Anton Bosch',
        business_type: 'Technology Solutions'
      };
      
      try {
        const authResult = await supabase.auth.admin.getUserById(userId);
        const authUser = authResult.data?.user;
        if (authUser) {
          profileData = {
            email: authUser.email || profileData.email,
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Entrepreneur',
            business_type: authUser.user_metadata?.business_type || 'Business'
          };
        }
      } catch (error) {
        console.log('Using fallback profile data for testing');
      }

      // FETCH GOALS AND ENTRIES FOR REAL DATA IN EMAIL
      const [goalsResult, entriesResult] = await Promise.all([
        supabase
          .from('goals')
          .select(`*, milestones(*)`)
          .eq('user_id', userId),
        supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
      ]);

      const goals = goalsResult.data || [];
      const recentEntries = entriesResult.data || [];

      console.log('🎯 Test email fetching real data:', {
        goalsCount: goals.length,
        entriesCount: recentEntries.length,
        goalTitles: goals.map(g => g.title)
      });

      // Generate email content first
      const emailContent = await this.emailService.generateDailyEmailContent(userId);
      
      if (!emailContent) {
        console.error(`❌ Failed to generate email content for user ${userId}`);
        return false;
      }

      const result = await this.emailService.sendDailyEmail(
        emailContent,
        profileData.email,
        {
          profile: {
            name: profileData.full_name || 'Entrepreneur',
            business_type: profileData.business_type || 'Business',
            email: profileData.email,
            user_id: userId
          },
          goals: goals,
          recentEntries: recentEntries
        }
      );

      if (result) {
        console.log(`✅ Test email sent successfully to ${profileData.email}`);
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

  // Helper method to process a single user with retry logic
  private async processSingleUser(setting: any, southAfricaTime: Date, retryCount = 0): Promise<{success: boolean, userId: string}> {
    const MAX_RETRIES = 3;
    
    try {
      // Check if email was already sent today with stronger duplicate protection
      const today = southAfricaTime.toISOString().split('T')[0];
      
      // First, try to insert a delivery lock to prevent race conditions
      const lockId = `${setting.user_id}-${today}-daily_digest`;
      const { data: existingEmail, error: checkError } = await supabase
        .from('email_delivery_log')
        .select('id, status')
        .eq('user_id', setting.user_id)
        .eq('email_type', 'daily_digest')
        .gte('sent_at', `${today}T00:00:00.000Z`)
        .order('sent_at', { ascending: false })
        .limit(1);

      if (existingEmail && existingEmail.length > 0) {
        console.log(`⚠️ Email already processed today for user ${setting.user_id} (status: ${existingEmail[0].status})`);
        return { success: true, userId: setting.user_id }; // Not an error, just already sent
      }

      // Create processing lock to prevent race conditions
      const { error: lockError } = await supabase
        .from('email_delivery_log')
        .insert({
          user_id: setting.user_id,
          email_type: 'daily_digest',
          email_address: 'processing@temp.com', // Temporary placeholder
          sent_at: new Date().toISOString(),
          status: 'processing',
          retry_count: retryCount
        });

      // If we can't create the lock (duplicate key), another process is handling this
      if (lockError && lockError.code === '23505') {
        console.log(`⚠️ Another process is handling email for user ${setting.user_id}`);
        return { success: true, userId: setting.user_id };
      }

      // Get user profile using auth method (same as test emails)
      let profileData = {
        email: 'fallback@example.com',
        full_name: 'Entrepreneur',
        business_type: 'Business'
      };
      
      try {
        const authResult = await supabase.auth.admin.getUserById(setting.user_id);
        const authUser = authResult.data?.user;
        if (authUser) {
          profileData = {
            email: authUser.email || profileData.email,
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Entrepreneur',
            business_type: authUser.user_metadata?.business_type || 'Business'
          };
        }
      } catch (error) {
        console.log(`Using fallback profile data for user ${setting.user_id}`);
      }
      
      // Generate email content first
      const emailContent = await this.emailService.generateDailyEmailContent(setting.user_id);
      
      if (!emailContent) {
        throw new Error(`Failed to generate email content for user ${setting.user_id}`);
      }

      // FETCH GOALS AND ENTRIES FOR REAL DATA IN EMAIL (same as test emails)
      const [goalsResult, entriesResult] = await Promise.all([
        supabase
          .from('goals')
          .select(`*, milestones(*)`)
          .eq('user_id', setting.user_id),
        supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', setting.user_id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
      ]);

      const goals = goalsResult.data || [];
      const recentEntries = entriesResult.data || [];

      const result = await this.emailService.sendDailyEmail(
        emailContent,
        profileData.email,
        {
          profile: {
            name: profileData.full_name || 'Entrepreneur',
            business_type: profileData.business_type || 'Business',
            email: profileData.email,
            user_id: setting.user_id
          },
          goals: goals,
          recentEntries: recentEntries
        }
      );

      if (result) {
        // Update the processing lock to mark as sent
        await supabase
          .from('email_delivery_log')
          .update({
            email_address: profileData.email,
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('user_id', setting.user_id)
          .eq('email_type', 'daily_digest')
          .eq('status', 'processing')
          .gte('sent_at', `${today}T00:00:00.000Z`);

        console.log(`✅ Email sent successfully to ${profileData.email}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);
        return { success: true, userId: setting.user_id };
      } else {
        // Update lock to mark as failed
        await supabase
          .from('email_delivery_log')
          .update({
            email_address: profileData.email,
            status: 'failed',
            error_message: 'Email service returned false'
          })
          .eq('user_id', setting.user_id)
          .eq('email_type', 'daily_digest')
          .eq('status', 'processing')
          .gte('sent_at', `${today}T00:00:00.000Z`);
        
        throw new Error('Email service returned false');
      }
    } catch (error: any) {
      console.error(`❌ Error sending email to user ${setting.user_id} (attempt ${retryCount + 1}):`, error);
      
      // RETRY LOGIC: Retry failed emails with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delayMs = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s delays
        console.log(`🔄 Retrying in ${delayMs}ms for user ${setting.user_id}`);
        await this.delay(delayMs);
        return this.processSingleUser(setting, southAfricaTime, retryCount + 1);
      }
      
      // Update processing lock to mark final failure
      const today = southAfricaTime.toISOString().split('T')[0];
      await supabase
        .from('email_delivery_log')
        .update({
          status: 'failed',
          error_message: `Failed after ${MAX_RETRIES} retries: ${error.message}`,
          retry_count: retryCount
        })
        .eq('user_id', setting.user_id)
        .eq('email_type', 'daily_digest')
        .eq('status', 'processing')
        .gte('sent_at', `${today}T00:00:00.000Z`);

      return { success: false, userId: setting.user_id };
    }
  }

  // Helper method to chunk array into batches
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Helper method for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      running: this.isRunning,
      processing: this.currentlyProcessing,
      next_check: this.isRunning ? 'Every hour at :00 minutes (Africa/Johannesburg)' : 'Not scheduled',
      cron_expression: '0 * * * *'
    };
  }
}

// Export singleton instance
export const simpleEmailScheduler = new SimpleEmailScheduler();