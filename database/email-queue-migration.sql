-- Email Queue System Tables for Scalable Processing
-- Supports thousands of users with distributed email processing

-- Email Queue Jobs Table
CREATE TABLE IF NOT EXISTS email_queue_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('daily_digest', 'goal_reminder', 'milestone_alert', 'welcome', 'password_reset')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  job_data JSONB DEFAULT '{}',
  worker_id VARCHAR(100),
  processing_time INTEGER -- milliseconds
);

-- Email Batch Configuration Table
CREATE TABLE IF NOT EXISTS email_batch_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_type VARCHAR(50) NOT NULL CHECK (batch_type IN ('hourly_digest', 'daily_summary', 'emergency')),
  target_hour INTEGER NOT NULL CHECK (target_hour >= 0 AND target_hour <= 23),
  total_jobs INTEGER NOT NULL DEFAULT 0,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  failed_jobs INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  worker_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Email Processing Statistics Table
CREATE TABLE IF NOT EXISTS email_processing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_jobs_processed INTEGER NOT NULL DEFAULT 0,
  successful_jobs INTEGER NOT NULL DEFAULT 0,
  failed_jobs INTEGER NOT NULL DEFAULT 0,
  average_processing_time INTEGER NOT NULL DEFAULT 0, -- milliseconds
  peak_queue_size INTEGER NOT NULL DEFAULT 0,
  worker_utilization DECIMAL(5,2) NOT NULL DEFAULT 0, -- percentage
  api_quota_usage JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Email Worker Status Table
CREATE TABLE IF NOT EXISTS email_worker_status (
  worker_id VARCHAR(100) PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'error', 'stopped')),
  current_job_id UUID REFERENCES email_queue_jobs(id),
  jobs_processed_today INTEGER NOT NULL DEFAULT 0,
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  error_count INTEGER NOT NULL DEFAULT 0,
  uptime_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  memory_usage INTEGER, -- MB
  cpu_usage DECIMAL(5,2) -- percentage
);

-- Email Rate Limiting Table
CREATE TABLE IF NOT EXISTS email_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  limit_type VARCHAR(50) NOT NULL CHECK (limit_type IN ('user_hourly', 'user_daily', 'global_hourly', 'api_quota')),
  limit_value INTEGER NOT NULL,
  current_usage INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_jobs_status_scheduled ON email_queue_jobs(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_jobs_user_id ON email_queue_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_jobs_priority ON email_queue_jobs(priority DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_jobs_worker_id ON email_queue_jobs(worker_id);
CREATE INDEX IF NOT EXISTS idx_email_batch_config_target_hour ON email_batch_config(target_hour);
CREATE INDEX IF NOT EXISTS idx_email_processing_stats_date ON email_processing_stats(date);
CREATE INDEX IF NOT EXISTS idx_email_worker_status_last_heartbeat ON email_worker_status(last_heartbeat);

-- Enable Row Level Security
ALTER TABLE email_queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_batch_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_processing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_worker_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_queue_jobs
CREATE POLICY "Users can view their own email jobs" ON email_queue_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all email jobs" ON email_queue_jobs
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for email_batch_config (admin only)
CREATE POLICY "Only service role can access batch config" ON email_batch_config
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for email_processing_stats (admin only)
CREATE POLICY "Only service role can access processing stats" ON email_processing_stats
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for email_worker_status (admin only)
CREATE POLICY "Only service role can access worker status" ON email_worker_status
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for email_rate_limits (admin only)
CREATE POLICY "Only service role can access rate limits" ON email_rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up old completed jobs (run daily)
CREATE OR REPLACE FUNCTION cleanup_completed_email_jobs()
RETURNS void AS $$
BEGIN
  -- Delete completed jobs older than 7 days
  DELETE FROM email_queue_jobs 
  WHERE status = 'completed' 
    AND completed_at < NOW() - INTERVAL '7 days';
  
  -- Delete failed jobs older than 30 days
  DELETE FROM email_queue_jobs 
  WHERE status = 'failed' 
    AND failed_at < NOW() - INTERVAL '30 days';
    
  -- Clean up old worker status records (older than 24 hours)
  DELETE FROM email_worker_status 
  WHERE last_heartbeat < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Function to get queue statistics
CREATE OR REPLACE FUNCTION get_email_queue_stats()
RETURNS TABLE(
  pending_jobs BIGINT,
  processing_jobs BIGINT,
  completed_today BIGINT,
  failed_today BIGINT,
  avg_processing_time NUMERIC,
  active_workers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM email_queue_jobs WHERE status = 'pending') as pending_jobs,
    (SELECT COUNT(*) FROM email_queue_jobs WHERE status = 'processing') as processing_jobs,
    (SELECT COUNT(*) FROM email_queue_jobs WHERE status = 'completed' AND completed_at >= CURRENT_DATE) as completed_today,
    (SELECT COUNT(*) FROM email_queue_jobs WHERE status = 'failed' AND failed_at >= CURRENT_DATE) as failed_today,
    (SELECT AVG(processing_time) FROM email_queue_jobs WHERE status = 'completed' AND completed_at >= CURRENT_DATE) as avg_processing_time,
    (SELECT COUNT(*) FROM email_worker_status WHERE status IN ('active', 'idle') AND last_heartbeat > NOW() - INTERVAL '5 minutes') as active_workers;
END;
$$ LANGUAGE plpgsql;