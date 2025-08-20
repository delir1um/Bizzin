// Simple script to create email queue tables using Supabase
// This will enable the production email system

import { supabase } from './server/lib/supabase.js';

async function createQueueTables() {
  console.log('🚀 Creating Email Queue Tables...\n');

  try {
    // Create the main email_queue_jobs table
    console.log('📋 Creating email_queue_jobs table...');
    const { error: jobsError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS email_queue_jobs (
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
        );
      `
    });

    if (jobsError && !jobsError.message.includes('already exists')) {
      console.error('❌ Error creating email_queue_jobs:', jobsError);
    } else {
      console.log('✅ email_queue_jobs table ready');
    }

    // Create worker status table
    console.log('👥 Creating email_worker_status table...');
    const { error: workerError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS email_worker_status (
          worker_id VARCHAR(100) PRIMARY KEY,
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          current_job_id UUID,
          jobs_processed_today INTEGER NOT NULL DEFAULT 0,
          last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          error_count INTEGER NOT NULL DEFAULT 0,
          uptime_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          memory_usage INTEGER,
          cpu_usage DECIMAL(5,2)
        );
      `
    });

    if (workerError && !workerError.message.includes('already exists')) {
      console.error('❌ Error creating email_worker_status:', workerError);
    } else {
      console.log('✅ email_worker_status table ready');
    }

    // Test the tables by checking if they exist
    console.log('🧪 Testing table access...');
    
    const { data: jobsTest, error: testError } = await supabase
      .from('email_queue_jobs')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      console.error('❌ Table test failed:', testError);
      return false;
    }

    console.log('✅ Database tables created and accessible!');
    console.log('\n🎉 Email Queue System Ready!');
    console.log('\nNext steps:');
    console.log('1. Restart the server to clear the table errors');
    console.log('2. The hourly email cron will work in production mode');
    console.log('3. Use API endpoints to manually trigger emails');
    
    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

// Alternative approach using direct SQL execution
async function createTablesDirectly() {
  console.log('🔄 Trying direct table creation...');

  // Try to insert a test job to see if table exists
  const { data: existingData, error: checkError } = await supabase
    .from('email_queue_jobs')
    .select('id')
    .limit(1);

  if (checkError && checkError.code === '42P01') {
    console.log('📋 Tables do not exist, manual creation needed');
    console.log('\n⚠️  MANUAL SETUP REQUIRED:');
    console.log('Please run this SQL in your Supabase dashboard:');
    console.log('\n-- Email Queue Tables --');
    console.log(`
CREATE TABLE email_queue_jobs (
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
);

CREATE TABLE email_worker_status (
  worker_id VARCHAR(100) PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  current_job_id UUID,
  jobs_processed_today INTEGER NOT NULL DEFAULT 0,
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  error_count INTEGER NOT NULL DEFAULT 0,
  uptime_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  memory_usage INTEGER,
  cpu_usage DECIMAL(5,2)
);

-- Add indexes for performance
CREATE INDEX idx_email_queue_jobs_status_scheduled ON email_queue_jobs(status, scheduled_for);
CREATE INDEX idx_email_queue_jobs_user_id ON email_queue_jobs(user_id);
    `);
    
    return false;
  } else {
    console.log('✅ Tables already exist and accessible');
    return true;
  }
}

// Run the setup
console.log('🚀 Email Queue Database Setup');
console.log('============================\n');

createQueueTables()
  .then(success => {
    if (!success) {
      return createTablesDirectly();
    }
    return success;
  })
  .then(result => {
    if (result) {
      console.log('\n✅ Setup complete - email system ready!');
    } else {
      console.log('\n⚠️  Manual setup required - see instructions above');
    }
  })
  .catch(console.error);