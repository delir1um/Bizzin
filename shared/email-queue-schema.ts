// Email Queue System Schema for Scalable Processing
// Supports thousands of users with distributed email processing

import { z } from "zod";

// Email Queue Job Status
export type EmailQueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

// Email Queue Job Type
export type EmailJobType = 'daily_digest' | 'goal_reminder' | 'milestone_alert' | 'welcome' | 'password_reset';

// Email Queue Job Schema
export type EmailQueueJob = {
  id: string;
  job_type: EmailJobType;
  user_id: string;
  user_email: string;
  status: EmailQueueStatus;
  priority: number; // 1-10, higher = more urgent
  scheduled_for: string; // ISO datetime when job should be processed
  created_at: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  retry_count: number;
  max_retries: number;
  error_message?: string;
  job_data: Record<string, any>; // Flexible job-specific data
  worker_id?: string; // Which worker is processing this job
};

// Email Batch Processing Configuration
export type EmailBatchConfig = {
  id: string;
  batch_type: 'hourly_digest' | 'daily_summary' | 'emergency';
  target_hour: number; // 0-23, which hour this batch targets
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  estimated_completion?: string;
  worker_count: number; // How many workers are processing this batch
  created_at: string;
};

// Email Processing Statistics (for monitoring)
export type EmailProcessingStats = {
  id: string;
  date: string; // YYYY-MM-DD
  total_jobs_processed: number;
  successful_jobs: number;
  failed_jobs: number;
  average_processing_time: number; // milliseconds
  peak_queue_size: number;
  worker_utilization: number; // percentage
  api_quota_usage: {
    hugging_face_requests: number;
    smtp_emails_sent: number;
    database_queries: number;
  };
  performance_metrics: {
    avg_email_generation_time: number;
    avg_email_send_time: number;
    avg_ai_analysis_time: number;
  };
  created_at: string;
};

// Worker Health Status
export type EmailWorkerStatus = {
  worker_id: string;
  status: 'active' | 'idle' | 'error' | 'stopped';
  current_job_id?: string;
  jobs_processed_today: number;
  last_heartbeat: string;
  error_count: number;
  uptime_start: string;
  memory_usage?: number; // MB
  cpu_usage?: number; // percentage
};

// Email Rate Limiting Configuration
export type EmailRateLimit = {
  id: string;
  limit_type: 'user_hourly' | 'user_daily' | 'global_hourly' | 'api_quota';
  limit_value: number;
  current_usage: number;
  reset_at: string;
  created_at: string;
  updated_at: string;
};

// Zod validation schemas
export const emailQueueJobSchema = z.object({
  job_type: z.enum(['daily_digest', 'goal_reminder', 'milestone_alert', 'welcome', 'password_reset']),
  user_id: z.string().uuid(),
  user_email: z.string().email(),
  priority: z.number().min(1).max(10).default(5),
  scheduled_for: z.string().datetime(),
  max_retries: z.number().min(0).max(5).default(3),
  job_data: z.record(z.any()).default({})
});

export const emailBatchConfigSchema = z.object({
  batch_type: z.enum(['hourly_digest', 'daily_summary', 'emergency']),
  target_hour: z.number().min(0).max(23),
  worker_count: z.number().min(1).max(10).default(3)
});

// Insert schemas
export const insertEmailQueueJobSchema = emailQueueJobSchema;
export const insertEmailBatchConfigSchema = emailBatchConfigSchema;

// Insert types
export type InsertEmailQueueJob = z.infer<typeof insertEmailQueueJobSchema>;
export type InsertEmailBatchConfig = z.infer<typeof insertEmailBatchConfigSchema>;