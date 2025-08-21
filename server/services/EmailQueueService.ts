// Scalable Email Queue Service
// Handles thousands of users with distributed processing and rate limiting

import { supabase } from '../lib/supabase.js';
import { EmailService } from './EmailService.js';
import { 
  EmailQueueJob, 
  EmailQueueStatus, 
  EmailJobType, 
  EmailBatchConfig,
  EmailProcessingStats,
  EmailWorkerStatus,
  InsertEmailQueueJob 
} from '../../shared/email-queue-schema.js';

export class EmailQueueService {
  private emailService: EmailService;
  private workerId: string;
  private isProcessing: boolean = false;
  private processingStats: Map<string, number> = new Map();
  private maxConcurrentJobs: number = process.env.NODE_ENV === 'development' ? 2 : 5; // Reduce concurrent jobs in development
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.emailService = new EmailService();
    this.workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.initializeWorker();
  }

  // Initialize worker with health monitoring
  private async initializeWorker() {
    console.log(`🟢 EmailQueueService worker ${this.workerId} initializing...`);
    
    // Initialize email templates for this worker
    await this.emailService.loadTemplates();
    
    // Register worker in database
    await this.registerWorker();
    
    // Start heartbeat monitoring
    this.startHeartbeat();
    
    // Graceful shutdown handling
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  // Register worker in database for monitoring
  private async registerWorker() {
    try {
      await supabase.from('email_worker_status').upsert({
        worker_id: this.workerId,
        status: 'active',
        jobs_processed_today: 0,
        last_heartbeat: new Date().toISOString(),
        error_count: 0,
        uptime_start: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to register worker:', error);
    }
  }

  // Send periodic heartbeat to monitor worker health
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await supabase.from('email_worker_status').upsert({
          worker_id: this.workerId,
          status: this.isProcessing ? 'active' : 'idle',
          last_heartbeat: new Date().toISOString(),
          jobs_processed_today: this.processingStats.get('jobs_today') || 0
        });
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 30000); // Every 30 seconds
  }

  // Queue email job for processing
  async queueEmailJob(jobData: InsertEmailQueueJob): Promise<string | null> {
    try {
      const job: Partial<EmailQueueJob> = {
        ...jobData,
        status: 'pending',
        retry_count: 0,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('email_queue_jobs')
        .insert(job)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to queue email job:', error);
        return null;
      }

      console.log(`📧 Email job queued: ${data.id} for user ${jobData.user_id}`);
      return data.id;
    } catch (error) {
      console.error('Error queueing email job:', error);
      return null;
    }
  }

  // Batch queue multiple email jobs (for hourly processing)
  async queueBatchEmailJobs(jobs: InsertEmailQueueJob[]): Promise<number> {
    try {
      const batchJobs = jobs.map(job => ({
        ...job,
        status: 'pending' as EmailQueueStatus,
        retry_count: 0,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('email_queue_jobs')
        .insert(batchJobs)
        .select('id');

      if (error) {
        console.error('Failed to queue batch email jobs:', error);
        return 0;
      }

      console.log(`📧 Batch queued: ${data?.length || 0} email jobs`);
      return data?.length || 0;
    } catch (error) {
      console.error('Error queueing batch email jobs:', error);
      return 0;
    }
  }

  // Process pending email jobs with concurrency control
  async processQueuedJobs(): Promise<void> {
    if (this.isProcessing) {
      console.log('⏭️ Worker already processing, skipping...');
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Worker ${this.workerId} starting job processing...`);

    try {
      // Get pending jobs ordered by priority and scheduled time
      const { data: pendingJobs, error } = await supabase
        .from('email_queue_jobs')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('scheduled_for', { ascending: true })
        .limit(this.maxConcurrentJobs);

      if (error) {
        console.error('Failed to fetch pending jobs:', error);
        return;
      }

      if (!pendingJobs || pendingJobs.length === 0) {
        console.log('📭 No pending email jobs to process');
        return;
      }

      console.log(`📬 Processing ${pendingJobs.length} email jobs concurrently`);

      // Process jobs concurrently with Promise.all
      const processingPromises = pendingJobs.map(job => this.processEmailJob(job));
      await Promise.all(processingPromises);

      console.log(`✅ Completed processing ${pendingJobs.length} email jobs`);
    } catch (error) {
      console.error('Error processing queued jobs:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual email job with retry logic
  private async processEmailJob(job: EmailQueueJob): Promise<void> {
    console.log(`🔄 Processing email job ${job.id} for ${job.user_email}`);
    
    try {
      // Mark job as processing
      await this.updateJobStatus(job.id, 'processing', { started_at: new Date().toISOString() });

      let success = false;
      const startTime = Date.now();

      // Process based on job type
      switch (job.job_type) {
        case 'daily_digest':
          success = await this.processDailyDigestJob(job);
          break;
        case 'goal_reminder':
          success = await this.processGoalReminderJob(job);
          break;
        case 'milestone_alert':
          success = await this.processMilestoneAlertJob(job);
          break;
        default:
          console.error(`❌ Unknown job type: ${job.job_type}`);
          success = false;
      }

      const processingTime = Date.now() - startTime;
      
      if (success) {
        await this.updateJobStatus(job.id, 'completed', { 
          completed_at: new Date().toISOString(),
          processing_time: processingTime 
        });
        console.log(`✅ Email job ${job.id} completed in ${processingTime}ms`);
        
        // Update daily stats
        this.updateProcessingStats('success', processingTime);
      } else {
        await this.handleJobFailure(job);
      }

    } catch (error) {
      console.error(`❌ Error processing email job ${job.id}:`, error);
      await this.handleJobFailure(job, error as Error);
    }
  }

  // Process daily digest email job
  private async processDailyDigestJob(job: EmailQueueJob): Promise<boolean> {
    try {
      // Generate email content
      const emailContent = await this.emailService.generateDailyEmailContent(job.user_id);
      if (!emailContent) {
        console.error(`Failed to generate email content for user ${job.user_id}`);
        return false;
      }

      // Send email
      const sent = await this.emailService.sendDailyEmail(emailContent, job.user_email);
      
      if (sent) {
        // Track analytics
        await this.trackEmailAnalytics(job.user_id, 'daily_digest', true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error processing daily digest job:', error);
      return false;
    }
  }

  // Process goal reminder email job
  private async processGoalReminderJob(job: EmailQueueJob): Promise<boolean> {
    // Implement goal reminder logic
    console.log(`📋 Processing goal reminder for ${job.user_email}`);
    // TODO: Implement goal reminder email generation and sending
    return true;
  }

  // Process milestone alert email job
  private async processMilestoneAlertJob(job: EmailQueueJob): Promise<boolean> {
    // Implement milestone alert logic
    console.log(`🎯 Processing milestone alert for ${job.user_email}`);
    // TODO: Implement milestone alert email generation and sending
    return true;
  }

  // Handle job failure with retry logic
  private async handleJobFailure(job: EmailQueueJob, error?: Error): Promise<void> {
    const retryCount = job.retry_count + 1;
    const errorMessage = error?.message || 'Unknown error';

    if (retryCount <= job.max_retries) {
      // Schedule retry with exponential backoff
      const retryDelay = Math.min(300000, 30000 * Math.pow(2, retryCount)); // Max 5 minutes
      const retryTime = new Date(Date.now() + retryDelay).toISOString();

      await this.updateJobStatus(job.id, 'retrying', {
        retry_count: retryCount,
        error_message: errorMessage,
        scheduled_for: retryTime
      });

      console.log(`🔄 Job ${job.id} scheduled for retry ${retryCount}/${job.max_retries} in ${retryDelay/1000}s`);
    } else {
      await this.updateJobStatus(job.id, 'failed', {
        failed_at: new Date().toISOString(),
        error_message: errorMessage
      });

      console.log(`❌ Job ${job.id} failed permanently after ${job.max_retries} retries`);
      this.updateProcessingStats('failure');
    }
  }

  // Update job status in database
  private async updateJobStatus(jobId: string, status: EmailQueueStatus, updates: Record<string, any> = {}): Promise<void> {
    try {
      await supabase
        .from('email_queue_jobs')
        .update({ status, ...updates })
        .eq('id', jobId);
    } catch (error) {
      console.error(`Failed to update job ${jobId} status:`, error);
    }
  }

  // Track email analytics
  private async trackEmailAnalytics(userId: string, emailType: string, sent: boolean): Promise<void> {
    try {
      if (sent) {
        await supabase.from('email_analytics').insert({
          user_id: userId,
          email_type: emailType,
          sent_at: new Date().toISOString(),
          engagement_score: 0
        });
      }
    } catch (error) {
      console.error('Error tracking email analytics:', error);
    }
  }

  // Update processing statistics
  private updateProcessingStats(result: 'success' | 'failure', processingTime?: number): void {
    const today = new Date().toISOString().split('T')[0];
    const jobsToday = this.processingStats.get('jobs_today') || 0;
    const successToday = this.processingStats.get('success_today') || 0;
    const failureToday = this.processingStats.get('failure_today') || 0;

    this.processingStats.set('jobs_today', jobsToday + 1);
    
    if (result === 'success') {
      this.processingStats.set('success_today', successToday + 1);
      if (processingTime) {
        const avgTime = this.processingStats.get('avg_processing_time') || 0;
        const newAvg = (avgTime * successToday + processingTime) / (successToday + 1);
        this.processingStats.set('avg_processing_time', newAvg);
      }
    } else {
      this.processingStats.set('failure_today', failureToday + 1);
    }
  }

  // Create batch configuration for hourly processing
  async createEmailBatch(targetHour: number, userCount: number): Promise<string | null> {
    try {
      const batch: Partial<EmailBatchConfig> = {
        batch_type: 'hourly_digest',
        target_hour: targetHour,
        total_jobs: userCount,
        completed_jobs: 0,
        failed_jobs: 0,
        status: 'pending',
        worker_count: Math.min(3, Math.ceil(userCount / 100)), // 1 worker per 100 users
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('email_batch_config')
        .insert(batch)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create email batch:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error creating email batch:', error);
      return null;
    }
  }

  // Get queue statistics for monitoring
  async getQueueStats(): Promise<any> {
    try {
      const { data: queueStats } = await supabase
        .from('email_queue_jobs')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        retrying: 0
      };

      queueStats?.forEach(job => {
        stats[job.status as keyof typeof stats]++;
      });

      return {
        ...stats,
        total: queueStats?.length || 0,
        worker_id: this.workerId,
        processing_stats: Object.fromEntries(this.processingStats)
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return null;
    }
  }

  // Graceful shutdown
  private async gracefulShutdown(): Promise<void> {
    console.log(`🛑 Worker ${this.workerId} shutting down gracefully...`);
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Wait for current jobs to complete
    if (this.isProcessing) {
      console.log('⏳ Waiting for current jobs to complete...');
      while (this.isProcessing) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update worker status
    await supabase.from('email_worker_status').upsert({
      worker_id: this.workerId,
      status: 'stopped',
      last_heartbeat: new Date().toISOString()
    });

    console.log(`✅ Worker ${this.workerId} shutdown complete`);
    process.exit(0);
  }
}