// Email API Routes
import express from 'express';
import { DailyEmailScheduler } from '../services/DailyEmailScheduler.js';
import { supabase } from '../lib/supabase.js';

const router = express.Router();
const emailScheduler = new DailyEmailScheduler();

// Initialize email scheduler on startup
emailScheduler.initialize().catch(console.error);

// Clean up email content (for testing)
router.delete('/content/cleanup', async (req, res) => {
  try {
    const { userId, date } = req.body;
    
    if (!userId || !date) {
      return res.status(400).json({ error: 'User ID and date are required' });
    }

    const { error } = await supabase
      .from('daily_email_content')
      .delete()
      .eq('user_id', userId)
      .eq('email_date', date);

    if (error) {
      return res.status(500).json({ error: 'Failed to clean up content' });
    }

    res.json({ message: 'Content cleaned up successfully' });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug profile endpoint  
router.get('/debug/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Debugging profile for user:', userId);

    // Test direct database query
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('Direct profile query result:', { data: !!profileData, error: profileError?.message });

    res.json({
      userId,
      profile: profileData,
      profileError: profileError?.message,
      hasProfile: !!profileData
    });
  } catch (error) {
    console.error('Debug profile error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
});

// Enable daily emails for a user (quick setup)
router.post('/enable', async (req, res) => {
  try {
    const { userId, sendTime = '08:00', timezone = 'Africa/Johannesburg' } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Create or update daily email settings
    const { data: existingSetting } = await supabase
      .from('daily_email_settings')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingSetting) {
      // Update existing
      const { error } = await supabase
        .from('daily_email_settings')
        .update({
          enabled: true,
          send_time: sendTime,
          timezone: timezone,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (error) throw error;
    } else {
      // Create new
      const { error } = await supabase
        .from('daily_email_settings')
        .insert({
          user_id: userId,
          enabled: true,
          send_time: sendTime,
          timezone: timezone,
          content_preferences: {
            journal_prompts: true,
            goal_summaries: true,
            business_insights: true,
            milestone_reminders: true
          }
        });
      
      if (error) throw error;
    }

    res.json({ message: 'Daily emails enabled successfully', sendTime, timezone });
  } catch (error) {
    console.error('Enable daily emails error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send test email
router.post('/test', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const success = await emailScheduler.sendTestEmail(userId);
    
    if (success) {
      res.json({ message: 'Test email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send test email' });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual trigger for daily emails (admin only)
router.post('/trigger-daily', async (req, res) => {
  try {
    console.log('=== MANUAL DAILY EMAIL TRIGGER ===');
    // Trigger daily emails by calling public methods
    const users = await emailScheduler['emailService'].getUsersForDailyEmails();
    console.log(`Found ${users.length} eligible users for daily emails`);
    
    let successCount = 0;
    for (const user of users) {
      const success = await emailScheduler.sendTestEmail(user.userId);
      if (success) successCount++;
    }
    
    res.json({ 
      message: `Daily emails processed: ${successCount}/${users.length} sent successfully`,
      eligibleUsers: users.length
    });
  } catch (error) {
    console.error('Manual trigger error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get email analytics (admin only)
router.get('/analytics', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const analytics = await emailScheduler.getEmailAnalytics(parseInt(days as string));
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Track email open
router.get('/track/open/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    
    // Update opened timestamp
    await supabase
      .from('email_analytics')
      .update({ 
        opened_at: new Date().toISOString(),
        engagement_score: 25 // Base score for opening
      })
      .eq('id', emailId);

    // Return 1x1 tracking pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(pixel);
  } catch (error) {
    console.error('Email tracking error:', error);
    res.status(500).end();
  }
});

// Track email click
router.get('/track/click/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { url } = req.query;
    
    // Update clicked timestamp
    await supabase
      .from('email_analytics')
      .update({ 
        clicked_at: new Date().toISOString(),
        engagement_score: 75 // Higher score for clicking
      })
      .eq('id', emailId);

    // Redirect to original URL
    res.redirect(url as string || '/');
  } catch (error) {
    console.error('Click tracking error:', error);
    res.redirect('/');
  }
});

// Unsubscribe from emails
router.get('/unsubscribe', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).send('Invalid unsubscribe token');
    }

    // Decode token (simple base64 for now)
    const decoded = Buffer.from(token as string, 'base64').toString();
    const [userId] = decoded.split(':');
    
    // Disable daily emails for user
    const { error } = await supabase
      .from('daily_email_settings')
      .update({ enabled: false })
      .eq('user_id', userId);

    if (error) {
      console.error('Unsubscribe error:', error);
      return res.status(500).send('Failed to unsubscribe');
    }

    // Track unsubscribe
    await supabase
      .from('email_analytics')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('unsubscribed_at', null);

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h2>Successfully Unsubscribed</h2>
          <p>You have been unsubscribed from Bizzin daily emails.</p>
          <p>You can re-enable emails anytime in your account settings.</p>
          <a href="/" style="color: #EA7A57;">Return to Bizzin</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).send('Failed to process unsubscribe request');
  }
});

export default router;