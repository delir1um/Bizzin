import { Router } from 'express';
import { simpleEmailScheduler } from '../services/SimpleEmailScheduler.js';

const router = Router();

// Get scheduler status
router.get('/status', (req, res) => {
  const status = simpleEmailScheduler.getStatus();
  res.json(status);
});

// Send test email for authenticated user
router.post('/test', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`📧 Test email requested for user: ${user_id}`);
    const success = await simpleEmailScheduler.sendTestEmail(user_id);
    
    if (success) {
      res.json({ message: 'Test email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send test email' });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manually start scheduler (for debugging)
router.post('/start', async (req, res) => {
  try {
    await simpleEmailScheduler.start();
    res.json({ message: 'Email scheduler started' });
  } catch (error) {
    console.error('Error starting scheduler:', error);
    res.status(500).json({ error: 'Failed to start scheduler' });
  }
});

// Stop scheduler (for debugging)
router.post('/stop', (req, res) => {
  try {
    simpleEmailScheduler.stop();
    res.json({ message: 'Email scheduler stopped' });
  } catch (error) {
    console.error('Error stopping scheduler:', error);
    res.status(500).json({ error: 'Failed to stop scheduler' });
  }
});

export default router;