// Grace Period API Routes - Admin tools for grace period management
import express from 'express';
import { GracePeriodService } from '../services/GracePeriodService.js';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Secure admin authentication middleware with proper JWT verification
const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required: Missing or invalid Authorization header' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token with Supabase
    const { data: userJWT, error: jwtError } = await supabase.auth.getUser(token);
    
    if (jwtError || !userJWT.user) {
      return res.status(401).json({ 
        error: 'Authentication failed: Invalid or expired token' 
      });
    }

    // Check if authenticated user has admin privileges
    const { data: adminUser, error: adminError } = await supabase
      .from('user_profiles')
      .select('user_id, email, is_admin')
      .eq('user_id', userJWT.user.id)
      .eq('is_admin', true)
      .single();

    if (adminError || !adminUser) {
      return res.status(403).json({ 
        error: 'Access denied: Admin privileges required' 
      });
    }

    // Attach verified admin user to request
    (req as any).adminUser = adminUser;
    (req as any).authenticatedUser = userJWT.user;
    next();
  } catch (error) {
    console.error('❌ Admin authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Start grace period for a user (when payment fails)
router.post('/start/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { failureReason } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`🏃‍♂️ Admin starting grace period for user: ${userId}`);
    
    const result = await GracePeriodService.startGracePeriod(userId, failureReason);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        grace_period_end: result.gracePeriodEnd
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Grace period start error:', error);
    res.status(500).json({ 
      error: 'Failed to start grace period',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Process all expired grace periods (cron job endpoint)
router.post('/process-expired', requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Admin processing expired grace periods');
    
    const result = await GracePeriodService.processExpiredGracePeriods();
    
    res.json({
      success: result.success,
      message: `Processed ${result.processed} grace periods, suspended ${result.suspended} accounts`,
      stats: {
        processed: result.processed,
        suspended: result.suspended,
        errors: result.errors.length
      },
      errors: result.errors
    });
  } catch (error) {
    console.error('Grace period processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process expired grace periods',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Restore user from suspension
router.post('/restore/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`🔄 Admin restoring user from suspension: ${userId}`);
    
    const result = await GracePeriodService.restoreFromSuspension(userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Grace period restore error:', error);
    res.status(500).json({ 
      error: 'Failed to restore from suspension',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Extend grace period for a user
router.post('/extend/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { additionalDays } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!additionalDays || additionalDays <= 0) {
      return res.status(400).json({ error: 'Additional days must be a positive number' });
    }

    console.log(`🔧 Admin extending grace period for user ${userId} by ${additionalDays} days`);
    
    const result = await GracePeriodService.extendGracePeriod(userId, additionalDays);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        new_grace_period_end: result.newGracePeriodEnd
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Grace period extend error:', error);
    res.status(500).json({ 
      error: 'Failed to extend grace period',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get grace period status for a user
router.get('/status/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const status = await GracePeriodService.getGracePeriodStatus(userId);
    
    res.json({
      success: true,
      status: {
        is_in_grace_period: status.isInGracePeriod,
        grace_period_end: status.gracePeriodEnd,
        days_remaining: status.daysRemaining,
        failed_payment_count: status.failedPaymentCount
      }
    });
  } catch (error) {
    console.error('Grace period status error:', error);
    res.status(500).json({ 
      error: 'Failed to get grace period status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get overview of all grace periods (admin dashboard)
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    console.log('📊 Admin grace period overview request');
    
    // Get grace period statistics
    const [
      { count: activeGracePeriods },
      { count: expiredGracePeriods },
      { count: suspendedAccounts },
      { data: gracePeriodDetails }
    ] = await Promise.all([
      supabase.from('user_plans').select('*', { count: 'exact', head: true }).eq('payment_status', 'grace_period').gt('grace_period_end', new Date().toISOString()),
      supabase.from('user_plans').select('*', { count: 'exact', head: true }).eq('payment_status', 'grace_period').lte('grace_period_end', new Date().toISOString()),
      supabase.from('user_plans').select('*', { count: 'exact', head: true }).eq('payment_status', 'suspended'),
      supabase.from('user_plans')
        .select('user_id, grace_period_end, failed_payment_count, payment_status')
        .eq('payment_status', 'grace_period')
        .order('grace_period_end', { ascending: true })
        .limit(20)
    ]);

    res.json({
      success: true,
      overview: {
        active_grace_periods: activeGracePeriods || 0,
        expired_grace_periods: expiredGracePeriods || 0,
        suspended_accounts: suspendedAccounts || 0,
        total_affected: (activeGracePeriods || 0) + (expiredGracePeriods || 0) + (suspendedAccounts || 0)
      },
      grace_period_details: gracePeriodDetails?.map(detail => ({
        user_id: detail.user_id,
        grace_period_end: detail.grace_period_end,
        days_remaining: detail.grace_period_end 
          ? Math.max(0, Math.ceil((new Date(detail.grace_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
          : 0,
        failed_payment_count: detail.failed_payment_count,
        status: detail.payment_status
      })) || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Grace period overview error:', error);
    res.status(500).json({ 
      error: 'Failed to get grace period overview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;