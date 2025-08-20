// Daily Email Scheduler - Handles cron jobs and email sending
import cron from 'node-cron';
import { EmailService } from './EmailService.js';
import { supabase } from '../lib/supabase.js';

export class DailyEmailScheduler {
  private emailService: EmailService;
  private isRunning: boolean = false;
  private lastTestEmailTime: number = 0;
  private readonly TEST_EMAIL_COOLDOWN = 5000; // 5 seconds cooldown between test emails

  constructor() {
    this.emailService = new EmailService();
  }

  // Initialize the scheduler
  async initialize() {
    console.log('Initializing Daily Email Scheduler...');
    
    // Load email templates
    await this.emailService.loadTemplates();

    // Schedule hourly email checks only in production (every hour at minute 0)
    if (process.env.NODE_ENV === 'production') {
      cron.schedule('0 * * * *', async () => {
        if (!this.isRunning) {
          console.log('Running hourly email check...');
          await this.processDailyEmails();
        }
      });
      console.log('Hourly email cron job scheduled (every hour at :00)');
    } else {
      console.log('Development mode: Automatic email scheduling disabled');
    }

    // Development mode: Don't auto-send emails on startup
    // Only send emails when explicitly requested via test button or scheduled cron

    console.log('Daily Email Scheduler initialized successfully');
  }

  // Process daily emails for eligible users
  public async processDailyEmails() {
    try {
      this.isRunning = true;
      
      // Convert server time to South Africa timezone (UTC+2)
      const now = new Date();
      const southAfricaTime = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // UTC+2
      const currentHour = southAfricaTime.getHours();
      
      console.log(`Running hourly email check...`);
      console.log(`Server UTC time: ${now.toISOString()}`);
      console.log(`South Africa time: ${southAfricaTime.toISOString()}, Hour: ${currentHour}`);
      console.log(`Processing hourly email check for ${currentHour}:00...`);

      // Get users ready for daily emails (filtered by current South Africa hour)
      const eligibleUsers = await this.emailService.getUsersForDailyEmails(currentHour);
      
      if (eligibleUsers.length === 0) {
        console.log(`No users scheduled for ${currentHour}:00 - skipping email processing`);
        this.isRunning = false;
        return;
      }

      console.log(`Processing ${eligibleUsers.length} users scheduled for ${currentHour}:00`);

      let emailsSent = 0;
      for (const user of eligibleUsers) {
        try {
          // Check if email already sent today
          const today = new Date().toISOString().split('T')[0];
          const { data: existingEmail } = await supabase
            .from('daily_email_content')
            .select('id, sent_at')
            .eq('user_id', user.userId)
            .eq('email_date', today)
            .single();

          if (existingEmail?.sent_at) {
            console.log(`Email already sent today for user ${user.userId}`);
            continue;
          }

          // Generate and send email content
          const emailContent = await this.emailService.generateDailyEmailContent(user.userId);
          if (!emailContent) {
            console.log(`Failed to generate content for user ${user.userId}`);
            continue;
          }

          const sent = await this.emailService.sendDailyEmail(emailContent, user.email);
          if (sent) {
            console.log(`Daily email sent successfully to ${user.email}`);
            emailsSent++;
            
            // Track analytics
            await this.trackEmailAnalytics(user.userId, 'daily_digest', true);
          } else {
            console.log(`Failed to send email to ${user.email}`);
            await this.trackEmailAnalytics(user.userId, 'daily_digest', false);
          }

          // Add delay between emails to avoid rate limiting
          await this.delay(2000); // 2 second delay
        } catch (error) {
          console.error(`Error processing daily email for user ${user.userId}:`, error);
        }
      }

      console.log(`Hourly email processing complete: ${emailsSent}/${eligibleUsers.length} emails sent successfully for ${currentHour}:00`);
    } catch (error) {
      console.error('Error in daily email processing:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Track email analytics
  private async trackEmailAnalytics(userId: string, emailType: string, sent: boolean) {
    try {
      if (sent) {
        await supabase.from('email_analytics').insert({
          user_id: userId,
          email_type: emailType,
          sent_at: new Date().toISOString(),
          engagement_score: 0 // Will be updated when user opens/clicks
        });
      }
    } catch (error) {
      console.error('Error tracking email analytics:', error);
    }
  }

  // Utility function for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manual trigger for testing
  async sendTestEmail(userId: string) {
    try {
      // Prevent rapid test email sending
      const now = Date.now();
      if (now - this.lastTestEmailTime < this.TEST_EMAIL_COOLDOWN) {
        const remainingTime = Math.ceil((this.TEST_EMAIL_COOLDOWN - (now - this.lastTestEmailTime)) / 1000);
        console.log(`Test email cooldown active. Please wait ${remainingTime} seconds.`);
        return false;
      }
      
      this.lastTestEmailTime = now;
      console.log(`=== SINGLE TEST EMAIL REQUEST for user ${userId} ===`);
      
      // Get user email from auth.users table (not user_profiles)
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);

      if (userError || !user?.user?.email) {
        console.error('User email not found:', userError);
        return false;
      }

      console.log(`Found user email: ${user.user.email}`);

      // First clear any existing content for today to avoid duplicate key constraint
      const today = new Date().toISOString().split('T')[0];
      const { error: deleteError } = await supabase
        .from('daily_email_content')
        .delete()
        .eq('user_id', userId)
        .eq('email_date', today);
      
      if (deleteError) {
        console.log('Delete error (might be expected):', deleteError.message);
      }

      // Fetch additional data needed for enhanced digest
      const [profileResult, goalsResult, entriesResult] = await Promise.all([
        // Get user profile
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single(),
        
        // Get user's goals  
        supabase
          .from('goals')
          .select(`*, milestones(*)`)
          .eq('user_id', userId),
          
        // Get recent journal entries
        supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const profile = profileResult.data;
      const goals = goalsResult.data || [];
      const recentEntries = entriesResult.data || [];

      // Generate content
      console.log('=== GENERATING EMAIL CONTENT ===');
      const emailContent = await this.emailService.generateDailyEmailContent(userId);
      if (!emailContent) {
        console.error('Failed to generate email content');
        return false;
      }
      console.log('=== EMAIL CONTENT GENERATED SUCCESSFULLY ===');

      // Send email with enhanced digest data
      console.log('=== SENDING SINGLE EMAIL ===');
      const sent = await this.emailService.sendDailyEmail(emailContent, user.user.email, {
        profile,
        goals,
        recentEntries
      });
      console.log(`=== TEST EMAIL ${sent ? 'COMPLETED SUCCESSFULLY' : 'FAILED'} to ${user.user.email} ===`);
      
      return sent;
    } catch (error) {
      console.error('Error sending test email:', error);
      return false;
    }
  }

  // Get email analytics for admin dashboard
  async getEmailAnalytics(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: analytics } = await supabase
        .from('email_analytics')
        .select('*')
        .gte('sent_at', startDate.toISOString())
        .order('sent_at', { ascending: false });

      if (!analytics) return null;

      // Calculate metrics
      const totalSent = analytics.length;
      const totalOpened = analytics.filter(a => a.opened_at).length;
      const totalClicked = analytics.filter(a => a.clicked_at).length;

      return {
        totalSent,
        totalOpened,
        totalClicked,
        openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        recentEmails: analytics.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting email analytics:', error);
      return null;
    }
  }
}