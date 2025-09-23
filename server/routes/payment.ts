// Payment API Routes - User payment history and management
import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// User authentication middleware
const requireUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

    // Attach verified user to request
    (req as any).authenticatedUser = userJWT.user;
    next();
  } catch (error) {
    console.error('❌ User authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Get payment history for the authenticated user
router.get('/history', requireUser, async (req, res) => {
  try {
    const userId = (req as any).authenticatedUser.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    
    console.log(`💳 Fetching payment history for user: ${userId} (page: ${page}, limit: ${limit})`);
    
    // Get payment transactions for the user
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select(`
        id,
        transaction_id,
        amount,
        currency,
        status,
        payment_method,
        paystack_reference,
        subscription_id,
        failure_reason,
        metadata,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching payment history:', error);
      return res.status(500).json({ error: 'Failed to fetch payment history' });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.warn('Warning fetching payment count:', countError);
    }

    const response = {
      transactions: transactions || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };

    console.log(`✅ Payment history retrieved: ${transactions?.length || 0} transactions for user: ${userId}`);
    res.json(response);
  } catch (error) {
    console.error('❌ Error in payment history endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment summary statistics
router.get('/summary', requireUser, async (req, res) => {
  try {
    const userId = (req as any).authenticatedUser.id;
    
    console.log(`📊 Fetching payment summary for user: ${userId}`);
    
    // Get payment statistics
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('amount, currency, status, created_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching payment summary:', error);
      return res.status(500).json({ error: 'Failed to fetch payment summary' });
    }

    // Calculate summary statistics
    const summary = {
      totalTransactions: transactions?.length || 0,
      successfulPayments: transactions?.filter(t => t.status === 'success').length || 0,
      failedPayments: transactions?.filter(t => t.status === 'failed').length || 0,
      totalAmountPaid: transactions
        ?.filter(t => t.status === 'success')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
      lastPaymentDate: transactions
        ?.filter(t => t.status === 'success')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at || null
    };

    console.log(`✅ Payment summary calculated for user: ${userId}`);
    res.json(summary);
  } catch (error) {
    console.error('❌ Error in payment summary endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest payment status (for real-time updates)
router.get('/latest-status', requireUser, async (req, res) => {
  try {
    const userId = (req as any).authenticatedUser.id;
    
    console.log(`⚡ Fetching latest payment status for user: ${userId}`);
    
    // Get the most recent transaction
    const { data: latestTransaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get current plan status
    const { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('payment_status, next_payment_date, grace_period_end')
      .eq('user_id', userId)
      .single();

    const response = {
      latestTransaction: latestTransaction || null,
      currentStatus: userPlan?.payment_status || 'free',
      nextPaymentDate: userPlan?.next_payment_date || null,
      gracePeriodEnd: userPlan?.grace_period_end || null
    };

    console.log(`✅ Latest payment status retrieved for user: ${userId}`);
    res.json(response);
  } catch (error) {
    console.error('❌ Error in latest payment status endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;