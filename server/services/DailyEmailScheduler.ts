// Daily Email Scheduler - Handles cron jobs and email sending
import cron from 'node-cron';
import { EmailService } from './EmailService.js';
import { supabase } from '../lib/supabase.js';

export class DailyEmailScheduler {
  private emailService: EmailService;
  private isRunning: boolean = false;

  constructor() {
    this.emailService = new EmailService();
  }

  // Initialize the scheduler
  async initialize() {
    console.log('Initializing Daily Email Scheduler...');
    
    // Load email templates
    await this.emailService.loadTemplates();

    // Schedule daily email checks every hour
    cron.schedule('0 * * * *', async () => {
      if (!this.isRunning) {
        console.log('Running daily email check...');
        await this.processDailyEmails();
      }
    });

    // Also run immediately on startup for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Running initial email check...');
      setTimeout(() => this.processDailyEmails(), 5000);
    }

    console.log('Daily Email Scheduler initialized successfully');
  }

  // Process daily emails for eligible users
  private async processDailyEmails() {
    try {
      this.isRunning = true;
      console.log('Processing daily emails...');

      // Get users ready for daily emails
      const eligibleUsers = await this.emailService.getUsersForDailyEmails();
      console.log(`Found ${eligibleUsers.length} users eligible for daily emails`);

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

      console.log('Daily email processing completed');
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
      console.log(`Sending test email for user ${userId}`);
      
      // Get user email
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('user_id', userId)
        .single();

      if (!profile?.email) {
        console.error('User email not found');
        return false;
      }

      // Generate content
      const emailContent = await this.emailService.generateDailyEmailContent(userId);
      if (!emailContent) {
        console.error('Failed to generate email content');
        return false;
      }

      // Send email
      const sent = await this.emailService.sendDailyEmail(emailContent, profile.email);
      console.log(`Test email ${sent ? 'sent successfully' : 'failed'} to ${profile.email}`);
      
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