// Payment Status API Routes - Admin tools for payment management
import express from 'express';
import { PaymentStatusService } from '../services/PaymentStatusService.js';
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

// Sync single user subscription status
router.post('/sync/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`🔄 Admin sync request for user: ${userId}`);
    
    const result = await PaymentStatusService.syncUserSubscriptionStatus(userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.syncedData
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Payment sync error:', error);
    res.status(500).json({ 
      error: 'Failed to sync payment status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Sync all active subscriptions (batch operation)
router.post('/sync-all', requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Admin batch sync request for all subscriptions');
    
    const result = await PaymentStatusService.syncAllActiveSubscriptions();
    
    res.json({
      success: result.success,
      message: result.message,
      results: result.results,
      summary: {
        total: result.results.length,
        successful: result.results.filter(r => r.success).length,
        failed: result.results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error('Batch sync error:', error);
    res.status(500).json({ 
      error: 'Failed to perform batch sync',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get payment history for a user
router.get('/history/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`📊 Admin payment history request for user: ${userId}`);
    
    const result = await PaymentStatusService.getPaymentHistory(userId, limit);
    
    res.json({
      success: result.success,
      message: result.message,
      transactions: result.transactions,
      count: result.transactions.length
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check subscription health across all users
router.get('/health', requireAdmin, async (req, res) => {
  try {
    console.log('🏥 Admin subscription health check request');
    
    const healthStats = await PaymentStatusService.checkSubscriptionHealth();
    
    res.json({
      success: true,
      message: 'Subscription health check completed',
      stats: {
        healthy: healthStats.healthy,
        grace_period: healthStats.grace_period,
        suspended: healthStats.suspended,
        failed_payments: healthStats.failed_payments,
        total: healthStats.healthy + healthStats.grace_period + healthStats.suspended + healthStats.failed_payments
      },
      issues: healthStats.details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      error: 'Failed to perform health check',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manual payment endpoint removed for security reasons
// Use Paystack dashboard or create proper payment initialization flow instead

// Get payment analytics summary
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    console.log('📈 Admin payment analytics request');
    
    // Get payment statistics from database
    const [
      { count: totalPremiumUsers },
      { count: activeSubscriptions },
      { count: suspendedAccounts },
      { count: graceAccounts },
      { count: failedPayments },
      { count: recentTransactions },
    ] = await Promise.all([
      supabase.from('user_plans').select('*', { count: 'exact', head: true }).eq('plan_type', 'premium'),
      supabase.from('user_plans').select('*', { count: 'exact', head: true }).eq('payment_status', 'active'),
      supabase.from('user_plans').select('*', { count: 'exact', head: true }).eq('payment_status', 'suspended'),
      supabase.from('user_plans').select('*', { count: 'exact', head: true }).eq('payment_status', 'grace_period'),
      supabase.from('user_plans').select('*', { count: 'exact', head: true }).eq('payment_status', 'failed'),
      supabase.from('payment_transactions').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    res.json({
      success: true,
      analytics: {
        total_premium_users: totalPremiumUsers || 0,
        active_subscriptions: activeSubscriptions || 0,
        suspended_accounts: suspendedAccounts || 0,
        grace_period_accounts: graceAccounts || 0,
        failed_payments: failedPayments || 0,
        recent_transactions_30d: recentTransactions || 0,
        health_percentage: totalPremiumUsers ? Math.round(((activeSubscriptions || 0) / totalPremiumUsers) * 100) : 100
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;