-- CRITICAL: Run this SQL in your Supabase Dashboard to enable email system
-- Go to: Supabase Dashboard > SQL Editor > New Query > Paste and Run

-- =====================================================
-- EMAIL QUEUE SYSTEM TABLES FOR PRODUCTION
-- =====================================================
-- This creates the scalable email processing system that supports 1000+ users

-- 1. Main email jobs queue table
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

-- 2. Worker status tracking table
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

-- 3. Batch configuration table
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

-- 4. Performance indexes for scalability
CREATE INDEX IF NOT EXISTS idx_email_queue_jobs_status_scheduled ON email_queue_jobs(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_jobs_user_id ON email_queue_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_jobs_priority ON email_queue_jobs(priority DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_jobs_worker_id ON email_queue_jobs(worker_id);
CREATE INDEX IF NOT EXISTS idx_email_worker_status_last_heartbeat ON email_worker_status(last_heartbeat);

-- 5. Row Level Security (RLS)
ALTER TABLE email_queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_worker_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_batch_config ENABLE ROW LEVEL SECURITY;

-- 6. Security Policies
CREATE POLICY "Users can view their own email jobs" ON email_queue_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all email jobs" ON email_queue_jobs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can access worker status" ON email_worker_status
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can access batch config" ON email_batch_config
  FOR ALL USING (auth.role() = 'service_role');

-- 7. Helper function for queue statistics
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

-- 8. Cleanup function for old jobs
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

-- =====================================================
-- SETUP COMPLETE - Your email system is now ready!
-- =====================================================
-- Next steps:
-- 1. Restart your application (it will stop showing table errors)
-- 2. Check NODE_ENV=production in your environment variables
-- 3. Emails will automatically be sent every hour in production
-- 4. Monitor the system at /admin/email-queue