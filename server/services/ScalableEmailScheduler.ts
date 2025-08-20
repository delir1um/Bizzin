// Scalable Email Scheduler - Queue-Based Architecture
// Replaces DailyEmailScheduler with distributed processing for thousands of users

import cron from 'node-cron';
import { EmailQueueService } from './EmailQueueService.js';
import { EmailService } from './EmailService.js';
import { supabase } from '../lib/supabase.js';
import { InsertEmailQueueJob } from '../../shared/email-queue-schema.js';

export class ScalableEmailScheduler {
  private emailQueueService: EmailQueueService;
  private emailService: EmailService;
  private isInitialized: boolean = false;
  private queueProcessorInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.emailQueueService = new EmailQueueService();
    this.emailService = new EmailService();
  }

  // Initialize the scalable scheduler
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🚀 Initializing Scalable Email Scheduler...');
    
    // Load email templates
    await this.emailService.loadTemplates();

    // Schedule email queue creation (every hour at minute 0)
    if (process.env.NODE_ENV === 'production') {
      // Create email jobs every hour
      cron.schedule('0 * * * *', async () => {
        console.log('📅 Running hourly email job creation...');
        await this.createHourlyEmailJobs();
      });

      // Process queued jobs every 2 minutes
      cron.schedule('*/2 * * * *', async () => {
        await this.emailQueueService.processQueuedJobs();
      });

      // Cleanup old jobs daily at 2 AM
      cron.schedule('0 2 * * *', async () => {
        await this.cleanupOldJobs();
      });

      // Generate daily statistics at midnight
      cron.schedule('0 0 * * *', async () => {
        await this.generateDailyStats();
      });

      console.log('⏰ Scalable email cron jobs scheduled:');
      console.log('  - Hourly job creation: 0 * * * *');
      console.log('  - Queue processing: */2 * * * *');
      console.log('  - Daily cleanup: 0 2 * * *');
      console.log('  - Statistics: 0 0 * * *');
    } else {
      console.log('🔧 Development mode: Manual queue processing only');
      
      // In development, process queue every 30 seconds for testing
      this.queueProcessorInterval = setInterval(async () => {
        await this.emailQueueService.processQueuedJobs();
      }, 30000);
    }

    this.isInitialized = true;
    console.log('✅ Scalable Email Scheduler initialized successfully');
  }

  // Create email jobs for all eligible users at current hour
  async createHourlyEmailJobs(): Promise<void> {
    try {
      // Convert server time to South Africa timezone (UTC+2)
      const now = new Date();
      const southAfricaTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
      const currentHour = southAfricaTime.getHours();
      
      console.log(`🕐 Creating email jobs for hour ${currentHour}:00 (SA Time)`);
      console.log(`Server UTC: ${now.toISOString()}`);
      console.log(`SA Time: ${southAfricaTime.toISOString()}`);

      // Get all users scheduled for this hour
      const eligibleUsers = await this.emailService.getUsersForDailyEmails(currentHour);
      
      if (eligibleUsers.length === 0) {
        console.log(`📭 No users scheduled for ${currentHour}:00 - skipping job creation`);
        return;
      }

      console.log(`📧 Creating ${eligibleUsers.length} email jobs for ${currentHour}:00`);

      // Create batch configuration
      const batchId = await this.emailQueueService.createEmailBatch(currentHour, eligibleUsers.length);
      
      // Create individual email jobs
      const emailJobs: InsertEmailQueueJob[] = eligibleUsers.map(user => ({
        job_type: 'daily_digest',
        user_id: user.userId,
        user_email: user.email,
        priority: 5, // Normal priority for daily digests
        scheduled_for: new Date().toISOString(), // Process immediately
        max_retries: 3,
        job_data: {
          batch_id: batchId,
          user_settings: user.settings,
          created_hour: currentHour
        }
      }));

      // Queue all jobs in batch
      const queuedCount = await this.emailQueueService.queueBatchEmailJobs(emailJobs);
      
      console.log(`✅ Successfully queued ${queuedCount}/${eligibleUsers.length} email jobs`);

      // Track batch creation analytics
      await this.trackBatchCreation(currentHour, eligibleUsers.length, queuedCount);

    } catch (error) {
      console.error('❌ Error creating hourly email jobs:', error);
    }
  }

  // Manual trigger for testing - queue all eligible users immediately
  async queueAllEligibleUsers(): Promise<number> {
    try {
      console.log('🔄 Manually queueing all eligible users...');
      
      // Get all users with email enabled (regardless of time)
      const { data: settings } = await supabase
        .from('daily_email_settings')
        .select(`
          *,
          user_profiles!inner(email)
        `)
        .eq('enabled', true);

      if (!settings || settings.length === 0) {
        console.log('📭 No users with email enabled found');
        return 0;
      }

      const emailJobs: InsertEmailQueueJob[] = settings.map((setting: any) => ({
        job_type: 'daily_digest',
        user_id: setting.user_id,
        user_email: setting.user_profiles.email,
        priority: 7, // Higher priority for manual triggers
        scheduled_for: new Date().toISOString(),
        max_retries: 3,
        job_data: {
          manual_trigger: true,
          user_settings: setting
        }
      }));

      const queuedCount = await this.emailQueueService.queueBatchEmailJobs(emailJobs);
      console.log(`✅ Manually queued ${queuedCount} email jobs`);
      
      return queuedCount;
    } catch (error) {
      console.error('❌ Error manually queueing users:', error);
      return 0;
    }
  }

  // Queue single user email (for testing or urgent notifications)
  async queueSingleUserEmail(userId: string, jobType: 'daily_digest' | 'goal_reminder' | 'milestone_alert' = 'daily_digest'): Promise<boolean> {
    try {
      // Get user email from auth
      const { data: user, error } = await supabase.auth.admin.getUserById(userId);
      
      if (error || !user?.user?.email) {
        console.error('User not found for single email queue:', error);
        return false;
      }

      const emailJob: InsertEmailQueueJob = {
        job_type: jobType,
        user_id: userId,
        user_email: user.user.email,
        priority: 8, // High priority for single user requests
        scheduled_for: new Date().toISOString(),
        max_retries: 3,
        job_data: {
          single_user_trigger: true,
          triggered_at: new Date().toISOString()
        }
      };

      const jobId = await this.emailQueueService.queueEmailJob(emailJob);
      
      if (jobId) {
        console.log(`✅ Single user email queued: ${jobId} for ${user.user.email}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error queueing single user email:', error);
      return false;
    }
  }

  // Get comprehensive queue and processing statistics
  async getSystemStats(): Promise<any> {
    try {
      const [queueStats, processingStats, workerStats] = await Promise.all([
        this.emailQueueService.getQueueStats(),
        this.getProcessingStats(),
        this.getWorkerStats()
      ]);

      return {
        queue: queueStats,
        processing: processingStats,
        workers: workerStats,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          node_env: process.env.NODE_ENV
        }
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      return null;
    }
  }

  // Get processing statistics from database
  private async getProcessingStats(): Promise<any> {
    try {
      const { data: stats } = await supabase
        .rpc('get_email_queue_stats');

      return stats?.[0] || null;
    } catch (error) {
      console.error('Error getting processing stats:', error);
      return null;
    }
  }

  // Get active worker statistics
  private async getWorkerStats(): Promise<any> {
    try {
      const { data: workers } = await supabase
        .from('email_worker_status')
        .select('*')
        .gte('last_heartbeat', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes

      return {
        active_workers: workers?.length || 0,
        workers: workers || []
      };
    } catch (error) {
      console.error('Error getting worker stats:', error);
      return null;
    }
  }

  // Track batch creation for analytics
  private async trackBatchCreation(hour: number, totalUsers: number, queuedJobs: number): Promise<void> {
    try {
      await supabase.from('email_processing_stats').upsert({
        date: new Date().toISOString().split('T')[0],
        total_jobs_processed: queuedJobs,
        successful_jobs: 0, // Will be updated as jobs complete
        failed_jobs: 0,
        average_processing_time: 0,
        peak_queue_size: queuedJobs,
        worker_utilization: 0,
        api_quota_usage: {
          batch_hour: hour,
          total_users: totalUsers,
          queued_jobs: queuedJobs
        }
      });
    } catch (error) {
      console.error('Error tracking batch creation:', error);
    }
  }

  // Cleanup old completed and failed jobs
  private async cleanupOldJobs(): Promise<void> {
    try {
      console.log('🧹 Running daily email job cleanup...');
      
      const { error } = await supabase.rpc('cleanup_completed_email_jobs');
      
      if (error) {
        console.error('Error during cleanup:', error);
      } else {
        console.log('✅ Email job cleanup completed successfully');
      }
    } catch (error) {
      console.error('Error running cleanup:', error);
    }
  }

  // Generate daily processing statistics
  private async generateDailyStats(): Promise<void> {
    try {
      console.log('📊 Generating daily email processing statistics...');
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      // Get job statistics for yesterday
      const { data: jobs } = await supabase
        .from('email_queue_jobs')
        .select('status, processing_time, completed_at, failed_at')
        .gte('created_at', `${dateStr}T00:00:00Z`)
        .lt('created_at', `${dateStr}T23:59:59Z`);

      if (!jobs || jobs.length === 0) {
        console.log('📭 No jobs to process for statistics');
        return;
      }

      const completedJobs = jobs.filter(j => j.status === 'completed');
      const failedJobs = jobs.filter(j => j.status === 'failed');
      const avgProcessingTime = completedJobs.length > 0 
        ? completedJobs.reduce((sum, j) => sum + (j.processing_time || 0), 0) / completedJobs.length
        : 0;

      // Update daily statistics
      await supabase.from('email_processing_stats').upsert({
        date: dateStr,
        total_jobs_processed: jobs.length,
        successful_jobs: completedJobs.length,
        failed_jobs: failedJobs.length,
        average_processing_time: Math.round(avgProcessingTime),
        peak_queue_size: jobs.length, // Approximation
        worker_utilization: completedJobs.length > 0 ? 85 : 0 // Approximation
      });

      console.log(`📈 Daily stats generated: ${completedJobs.length}/${jobs.length} successful`);
    } catch (error) {
      console.error('Error generating daily stats:', error);
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Scalable Email Scheduler...');
    
    if (this.queueProcessorInterval) {
      clearInterval(this.queueProcessorInterval);
    }
    
    console.log('✅ Scalable Email Scheduler shutdown complete');
  }
}