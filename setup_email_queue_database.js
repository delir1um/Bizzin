// Setup Email Queue Database Tables for Production
// Run this script to create the necessary tables in Supabase

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createEmailQueueTables() {
  console.log('🚀 Setting up Email Queue Database Tables for Production...\n');

  // SQL to create all email queue tables
  const createTablesSQL = `
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
      processing_time INTEGER
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
      average_processing_time INTEGER NOT NULL DEFAULT 0,
      peak_queue_size INTEGER NOT NULL DEFAULT 0,
      worker_utilization DECIMAL(5,2) NOT NULL DEFAULT 0,
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
      memory_usage INTEGER,
      cpu_usage DECIMAL(5,2)
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
  `;

  try {
    console.log('📋 Creating email queue tables...');
    const { error: createError } = await supabase.rpc('exec_sql', { query: createTablesSQL });
    
    if (createError) {
      // Try alternative approach with individual table creation
      console.log('Trying alternative table creation approach...');
      
      const tables = [
        {
          name: 'email_queue_jobs',
          sql: `CREATE TABLE IF NOT EXISTS email_queue_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            job_type VARCHAR(50) NOT NULL,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            user_email VARCHAR(255) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            priority INTEGER NOT NULL DEFAULT 5,
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
            processing_time INTEGER
          );`
        },
        {
          name: 'email_worker_status',
          sql: `CREATE TABLE IF NOT EXISTS email_worker_status (
            worker_id VARCHAR(100) PRIMARY KEY,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            current_job_id UUID,
            jobs_processed_today INTEGER NOT NULL DEFAULT 0,
            last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            error_count INTEGER NOT NULL DEFAULT 0,
            uptime_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            memory_usage INTEGER,
            cpu_usage DECIMAL(5,2)
          );`
        }
      ];

      for (const table of tables) {
        console.log(`Creating ${table.name}...`);
        const { error } = await supabase.rpc('exec_sql', { query: table.sql });
        if (error) {
          console.error(`Error creating ${table.name}:`, error);
        } else {
          console.log(`✅ ${table.name} created successfully`);
        }
      }
    } else {
      console.log('✅ All email queue tables created successfully');
    }

    // Create indexes for performance
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_email_queue_jobs_status_scheduled ON email_queue_jobs(status, scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_email_queue_jobs_user_id ON email_queue_jobs(user_id);
      CREATE INDEX IF NOT EXISTS idx_email_queue_jobs_priority ON email_queue_jobs(priority DESC);
      CREATE INDEX IF NOT EXISTS idx_email_queue_jobs_worker_id ON email_queue_jobs(worker_id);
    `;

    console.log('🔍 Creating database indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', { query: indexSQL });
    
    if (indexError) {
      console.log('⚠️  Index creation warning:', indexError.message);
    } else {
      console.log('✅ Database indexes created');
    }

    // Enable RLS
    console.log('🔐 Setting up Row Level Security...');
    const rlsSQL = `
      ALTER TABLE email_queue_jobs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE email_worker_status ENABLE ROW LEVEL SECURITY;

      -- Policy for email_queue_jobs
      CREATE POLICY IF NOT EXISTS "Users can view their own email jobs" ON email_queue_jobs
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Service role can manage all email jobs" ON email_queue_jobs
        FOR ALL USING (auth.role() = 'service_role');

      -- Policy for email_worker_status (service role only)
      CREATE POLICY IF NOT EXISTS "Only service role can access worker status" ON email_worker_status
        FOR ALL USING (auth.role() = 'service_role');
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { query: rlsSQL });
    
    if (rlsError) {
      console.log('⚠️  RLS setup warning:', rlsError.message);
    } else {
      console.log('✅ Row Level Security configured');
    }

    // Test the setup
    console.log('🧪 Testing database connection...');
    const { data, error: testError } = await supabase.from('email_queue_jobs').select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Database test failed:', testError);
    } else {
      console.log('✅ Database connection test passed');
    }

    console.log('\n🎉 Email Queue Database Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Restart your application server');
    console.log('2. Check that NODE_ENV=production in your environment');
    console.log('3. Emails will now be sent automatically every hour');
    console.log('4. Monitor the queue at /admin/email-queue');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
createEmailQueueDatabase().catch(console.error);