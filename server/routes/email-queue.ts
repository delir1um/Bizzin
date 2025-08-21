// Email Queue API Routes for Scalable Email Processing
// Provides endpoints for monitoring and managing the email queue system

import { Router } from 'express';
import { ScalableEmailScheduler } from '../services/ScalableEmailScheduler.js';
import { EmailQueueService } from '../services/EmailQueueService.js';

const router = Router();

// Only initialize email systems if not in development or if explicitly needed
const shouldInitializeEmail = process.env.NODE_ENV !== 'development' || process.env.FORCE_EMAIL_WORKERS === 'true';

let emailScheduler: ScalableEmailScheduler | null = null;
let emailQueueService: EmailQueueService | null = null;

if (shouldInitializeEmail) {
  emailScheduler = new ScalableEmailScheduler();
  emailQueueService = new EmailQueueService();
  // Initialize scheduler on first load
  emailScheduler.initialize().catch(console.error);
} else {
  console.log('🔧 Email workers disabled in development mode');
}

// Get queue system statistics
router.get('/stats', async (req, res) => {
  try {
    if (!emailScheduler) {
      return res.json({ message: 'Email system disabled in development mode', workers: 0, queue: { pending: 0 } });
    }
    const stats = await emailScheduler.getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({ error: 'Failed to get queue statistics' });
  }
});

// Get detailed queue information
router.get('/queue', async (req, res) => {
  try {
    const queueStats = await emailQueueService.getQueueStats();
    res.json(queueStats);
  } catch (error) {
    console.error('Error getting queue info:', error);
    res.status(500).json({ error: 'Failed to get queue information' });
  }
});

// Manually trigger email processing for all eligible users
router.post('/process-all', async (req, res) => {
  try {
    if (!emailScheduler) {
      return res.json({ message: 'Email processing disabled in development mode', queued_jobs: 0 });
    }
    console.log('📧 Manual trigger: Processing all eligible users');
    const queuedCount = await emailScheduler.queueAllEligibleUsers();
    
    res.json({ 
      message: 'Email processing triggered successfully',
      queued_jobs: queuedCount 
    });
  } catch (error) {
    console.error('Error triggering email processing:', error);
    res.status(500).json({ error: 'Failed to trigger email processing' });
  }
});

// Manually queue single user email
router.post('/queue-user', async (req, res) => {
  try {
    const { userId, jobType = 'daily_digest' } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`📧 Manual trigger: Queueing email for user ${userId}`);
    if (!emailScheduler) {
      return res.json({ message: 'Email queue disabled in development mode', success: false });
    }
    const success = await emailScheduler.queueSingleUserEmail(userId, jobType);
    
    if (success) {
      res.json({ message: 'User email queued successfully' });
    } else {
      res.status(500).json({ error: 'Failed to queue user email' });
    }
  } catch (error) {
    console.error('Error queueing user email:', error);
    res.status(500).json({ error: 'Failed to queue user email' });
  }
});

// Process pending jobs manually (for development/testing)
router.post('/process-pending', async (req, res) => {
  try {
    if (!emailQueueService) {
      return res.json({ message: 'Email processing disabled in development mode' });
    }
    console.log('🔄 Manual trigger: Processing pending jobs');
    await emailQueueService.processQueuedJobs();
    
    res.json({ message: 'Pending jobs processing triggered' });
  } catch (error) {
    console.error('Error processing pending jobs:', error);
    res.status(500).json({ error: 'Failed to process pending jobs' });
  }
});

// Create hourly email jobs manually (for testing)
router.post('/create-hourly-jobs', async (req, res) => {
  try {
    if (!emailScheduler) {
      return res.json({ message: 'Email scheduler disabled in development mode' });
    }
    console.log('⏰ Manual trigger: Creating hourly email jobs');
    await emailScheduler.createHourlyEmailJobs();
    
    res.json({ message: 'Hourly email jobs created successfully' });
  } catch (error) {
    console.error('Error creating hourly jobs:', error);
    res.status(500).json({ error: 'Failed to create hourly jobs' });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const stats = await emailQueueService.getQueueStats();
    const isHealthy = stats && typeof stats.total === 'number';
    
    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      queue_accessible: isHealthy,
      worker_id: stats?.worker_id || 'unknown'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Queue system unavailable'
    });
  }
});

export default router;