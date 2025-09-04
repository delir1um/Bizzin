// Email API Routes - Unified email management endpoints
import express from 'express';
import { simpleEmailScheduler } from '../services/SimpleEmailScheduler.js';
import { supabase } from '../lib/supabase.js';
import crypto from 'crypto';

const router = express.Router();
// Use the same email scheduler instance from server startup

// Custom password reset endpoint using our email service
router.post('/password-reset', async (req, res) => {
  console.log('🔥 Password reset endpoint hit:', req.body);
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists by email (using direct database query)
    console.log(`🔍 Checking user existence for: ${email}`);
    
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.log(`❌ User not found: ${email}`, userError?.message);
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with this email exists, you will receive a password reset link.' });
    }
    
    console.log(`✅ User found: ${email} (ID: ${userData.id})`);

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .upsert({
        user_id: userData.id,
        email: email,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (tokenError) {
      console.error('Error storing reset token:', tokenError);
      return res.status(500).json({ error: 'Failed to process reset request' });
    }

    // Send password reset email using our email service
    const resetUrl = `${process.env.NODE_ENV === 'production' ? 'https://bizzin.co.za' : 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    const emailSent = await simpleEmailScheduler.emailService.sendPasswordResetEmail(email, resetUrl);
    
    if (emailSent) {
      console.log(`✅ Password reset email sent to ${email}`);
      res.json({ message: 'Password reset email sent successfully' });
    } else {
      console.error(`❌ Failed to send password reset email to ${email}`);
      res.status(500).json({ error: 'Failed to send reset email' });
    }
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle password reset token verification and update
router.post('/password-reset/verify', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Verify reset token
    const { data: resetData, error: resetError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (resetError || !resetData) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      resetData.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json({ error: 'Failed to update password' });
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token);

    res.json({ message: 'Password updated successfully' });
    
  } catch (error) {
    console.error('Password reset verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

// Debug settings access endpoint - tests exact same query as scheduler
router.get('/debug/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // Test the exact same query used by the scheduler
    const { data: setting, error } = await supabase
      .from('daily_email_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    res.json({
      userId,
      settings: setting,
      settingsError: error?.message,
      errorCode: error?.code,
      hasSettings: !!setting,
      queryMethod: 'routes-supabase-client'
    });
  } catch (error) {
    console.error('Debug settings error:', error);
    res.status(500).json({ error: 'Debug failed' });
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

// Save/update email settings from profile (main endpoint for profile page)
router.post('/settings', async (req, res) => {
  try {
    const { userId, enabled, sendTime = '08:00', timezone = 'Africa/Johannesburg', contentPreferences } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Update or create email settings
    const { data: existingSetting } = await supabase
      .from('daily_email_settings')
      .select('id')
      .eq('user_id', userId)
      .single();

    const settingsData = {
      enabled: enabled !== undefined ? enabled : true,
      send_time: sendTime,
      timezone: timezone,
      content_preferences: contentPreferences || {
        journal_prompts: true,
        goal_summaries: true,
        business_insights: true,
        milestone_reminders: true
      },
      updated_at: new Date().toISOString()
    };

    if (existingSetting) {
      const { error } = await supabase
        .from('daily_email_settings')
        .update(settingsData)
        .eq('user_id', userId);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('daily_email_settings')
        .insert({
          user_id: userId,
          ...settingsData
        });
      
      if (error) throw error;
    }

    res.json({ 
      message: 'Email settings saved successfully', 
      settings: { sendTime, timezone, enabled: settingsData.enabled }
    });
  } catch (error) {
    console.error('Save email settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current email settings for a user
router.get('/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { data: settings, error } = await supabase
      .from('daily_email_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    // Return default settings if none exist
    const defaultSettings = {
      enabled: false,
      send_time: '08:00',
      timezone: 'Africa/Johannesburg',
      content_preferences: {
        journal_prompts: true,
        goal_summaries: true,
        business_insights: true,
        milestone_reminders: true
      }
    };

    res.json({ 
      settings: settings || defaultSettings,
      hasSettings: !!settings
    });
  } catch (error) {
    console.error('Get email settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
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

    const success = await simpleEmailScheduler.sendTestEmail(userId);
    
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
    // Get all users with email enabled for manual trigger
    const { data: settings } = await supabase
      .from('daily_email_settings')
      .select('user_id')
      .eq('enabled', true);
    
    const users = settings || [];
    console.log(`Found ${users.length} eligible users for daily emails`);
    
    let successCount = 0;
    for (const userSetting of users) {
      const success = await simpleEmailScheduler.sendTestEmail(userSetting.user_id);
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
    // Get basic email analytics from database
    const { data: analytics } = await supabase
      .from('email_analytics')
      .select('*')
      .gte('created_at', new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000).toISOString());
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

// System email testing endpoints
router.post('/system/test-welcome', async (req, res) => {
  try {
    const { email, confirmationUrl } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const testConfirmationUrl = confirmationUrl || 'https://bizzin.co.za/auth?mode=email_confirmation&token=test-token-123';
    const success = await simpleEmailScheduler.emailService.sendWelcomeEmail(email, testConfirmationUrl);
    
    if (success) {
      res.json({ message: 'Welcome email sent successfully', email, confirmationUrl: testConfirmationUrl });
    } else {
      res.status(500).json({ error: 'Failed to send welcome email' });
    }
  } catch (error) {
    console.error('Welcome email test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/system/test-password-reset', async (req, res) => {
  try {
    const { email, resetUrl } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const testResetUrl = resetUrl || 'https://bizzin.co.za/reset-password?token=test-reset-token-456';
    const success = await simpleEmailScheduler.emailService.sendPasswordResetEmail(email, testResetUrl);
    
    if (success) {
      res.json({ message: 'Password reset email sent successfully', email, resetUrl: testResetUrl });
    } else {
      res.status(500).json({ error: 'Failed to send password reset email' });
    }
  } catch (error) {
    console.error('Password reset email test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available email templates
router.get('/templates', async (req, res) => {
  try {
    await simpleEmailScheduler.emailService.loadTemplates();
    const availableTemplates = Array.from(simpleEmailScheduler.emailService.templates.keys());
    res.json({ 
      templates: availableTemplates,
      message: 'All templates loaded successfully' 
    });
  } catch (error) {
    console.error('Templates listing error:', error);
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

export default router;