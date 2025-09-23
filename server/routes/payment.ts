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

// Generate secure payment method update URL using Paystack
router.post('/update-payment-method', requireUser, async (req, res) => {
  try {
    const userId = (req as any).authenticatedUser.id;
    
    console.log(`💳 Generating payment method update URL for user: ${userId}`);
    
    // Get user's plan and customer information
    const { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('paystack_customer_code, paystack_subscription_code')
      .eq('user_id', userId)
      .single();

    if (planError || !userPlan) {
      return res.status(404).json({ error: 'User plan not found' });
    }

    // Check if user has an active subscription
    if (!userPlan.paystack_subscription_code) {
      return res.status(400).json({ 
        error: 'No active subscription found',
        message: 'You need an active subscription to update payment methods'
      });
    }

    // Get user profile for email
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Payment system configuration error' });
    }

    // Generate unique reference for this card update transaction
    const updateReference = `card_update_${userId}_${Date.now()}`;
    
    // Create return URL for after payment method update
    const returnUrl = process.env.NODE_ENV === 'production' 
      ? 'https://bizzin.co.za/profile?tab=billing&update=success'
      : 'http://localhost:5000/profile?tab=billing&update=success';

    // Initialize Paystack transaction for card update (R0.01 authorization)
    const paystackData = {
      reference: updateReference,
      amount: 1, // R0.01 in kobo for card authorization
      email: userProfile.email,
      currency: 'ZAR',
      callback_url: returnUrl,
      metadata: {
        type: 'card_update',
        user_id: userId,
        customer_code: userPlan.paystack_customer_code,
        subscription_code: userPlan.paystack_subscription_code,
        purpose: 'Update payment method for subscription'
      },
      channels: ['card'] // Only allow card payments
    };

    // Call Paystack transaction initialization API
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paystackData)
    });

    if (!paystackResponse.ok) {
      const errorText = await paystackResponse.text();
      console.error('Paystack transaction initialization failed:', errorText);
      return res.status(500).json({ error: 'Failed to initialize payment method update with Paystack' });
    }

    const paystackResult = await paystackResponse.json();
    
    if (!paystackResult.status || !paystackResult.data?.authorization_url) {
      console.error('Paystack response invalid:', paystackResult);
      return res.status(500).json({ error: 'Invalid response from payment processor' });
    }

    // Log the payment method update attempt
    try {
      await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          transaction_id: updateReference,
          amount: 0.01, // R0.01 for authorization
          currency: 'ZAR',
          status: 'pending',
          payment_method: 'card_update',
          paystack_reference: updateReference,
          metadata: {
            type: 'card_update',
            customer_code: userPlan.paystack_customer_code,
            subscription_code: userPlan.paystack_subscription_code,
            paystack_access_code: paystackResult.data.access_code,
            authorization_url: paystackResult.data.authorization_url,
            initiated_at: new Date().toISOString()
          }
        });
    } catch (auditError) {
      console.warn('Failed to log payment method update attempt:', auditError);
    }

    console.log(`✅ Payment method update session created for user: ${userId}`);
    
    res.json({
      success: true,
      authorization_url: paystackResult.data.authorization_url,
      access_code: paystackResult.data.access_code,
      reference: updateReference,
      message: 'Payment method update session created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating payment method update session:', error);
    res.status(500).json({ error: 'Failed to create payment method update session' });
  }
});

// Verify payment method update completion using Paystack
router.post('/verify-payment-method-update', requireUser, async (req, res) => {
  try {
    const userId = (req as any).authenticatedUser.id;
    const { reference } = req.body;
    
    console.log(`🔍 Verifying payment method update for user: ${userId}, reference: ${reference}`);
    
    if (!reference) {
      return res.status(400).json({ error: 'Transaction reference is required' });
    }

    // Check if this reference belongs to the user
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('paystack_reference', reference)
      .eq('user_id', userId)
      .single();

    if (transactionError || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status === 'success') {
      return res.json({
        success: true,
        status: 'success',
        message: 'Payment method already updated successfully'
      });
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Payment system configuration error' });
    }

    // Verify with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error('Paystack verification failed:', errorText);
      return res.status(500).json({ error: 'Failed to verify with payment processor' });
    }

    const verifyResult = await verifyResponse.json();
    
    if (!verifyResult.status) {
      console.error('Paystack verification response invalid:', verifyResult);
      return res.status(400).json({ error: 'Invalid verification response from payment processor' });
    }

    const transactionData = verifyResult.data;
    
    if (transactionData.status === 'success') {
      // Get user plan to update the authorization
      const { data: userPlan, error: planError } = await supabase
        .from('user_plans')
        .select('paystack_customer_code, paystack_subscription_code')
        .eq('user_id', userId)
        .single();

      // Update the transaction status
      await supabase
        .from('payment_transactions')
        .update({
          status: 'success',
          metadata: {
            ...transaction.metadata,
            completed_at: new Date().toISOString(),
            verified: true,
            paystack_authorization: transactionData.authorization,
            verification_data: {
              amount: transactionData.amount,
              currency: transactionData.currency,
              channel: transactionData.channel,
              verified_at: new Date().toISOString()
            }
          }
        })
        .eq('id', transaction.id);

      // If there's a subscription, update it with the new authorization
      if (userPlan?.paystack_subscription_code && transactionData.authorization?.authorization_code) {
        try {
          // Update subscription with new authorization
          const subscriptionUpdateResponse = await fetch(`https://api.paystack.co/subscription/${userPlan.paystack_subscription_code}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${paystackSecretKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              authorization: transactionData.authorization.authorization_code
            })
          });

          if (subscriptionUpdateResponse.ok) {
            console.log(`✅ Subscription updated with new authorization for user: ${userId}`);
          } else {
            console.warn('Failed to update subscription with new authorization:', await subscriptionUpdateResponse.text());
          }
        } catch (subscriptionError) {
          console.warn('Error updating subscription authorization:', subscriptionError);
        }
      }

      console.log(`✅ Payment method update verified and completed for user: ${userId}`);
      
      res.json({
        success: true,
        status: 'success',
        authorization: transactionData.authorization,
        message: 'Payment method updated successfully'
      });
    } else {
      // Update transaction with failed status
      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          metadata: {
            ...transaction.metadata,
            failed_at: new Date().toISOString(),
            failure_reason: transactionData.gateway_response || 'Transaction not successful',
            verification_data: transactionData
          }
        })
        .eq('id', transaction.id);

      res.status(400).json({
        success: false,
        status: transactionData.status,
        message: transactionData.gateway_response || 'Payment method update failed'
      });
    }

  } catch (error) {
    console.error('❌ Error verifying payment method update:', error);
    res.status(500).json({ error: 'Failed to verify payment method update' });
  }
});

// Cancel active subscription
router.post('/cancel-subscription', requireUser, async (req, res) => {
  try {
    const userId = (req as any).authenticatedUser.id;
    
    console.log(`🚫 Processing subscription cancellation for user: ${userId}`);
    
    // Get user's plan and subscription information
    const { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('paystack_subscription_code, payment_status, plan_type')
      .eq('user_id', userId)
      .single();

    if (planError || !userPlan) {
      return res.status(404).json({ error: 'User plan not found' });
    }

    // Check if user has an active subscription to cancel
    if (!userPlan.paystack_subscription_code) {
      return res.status(400).json({ 
        error: 'No active subscription found',
        message: 'You do not have an active subscription to cancel'
      });
    }

    if (userPlan.payment_status === 'cancelled') {
      return res.status(400).json({
        error: 'Subscription already cancelled',
        message: 'Your subscription is already cancelled'
      });
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Payment system configuration error' });
    }

    // Disable the subscription with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/subscription/disable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: userPlan.paystack_subscription_code,
        token: 'cancel_requested'
      })
    });

    if (!paystackResponse.ok) {
      const errorText = await paystackResponse.text();
      console.error('Paystack subscription cancellation failed:', errorText);
      return res.status(500).json({ error: 'Failed to cancel subscription with payment processor' });
    }

    const paystackResult = await paystackResponse.json();
    
    if (!paystackResult.status) {
      console.error('Paystack cancellation response invalid:', paystackResult);
      return res.status(500).json({ error: 'Invalid response from payment processor' });
    }

    // Update user plan status to cancelled
    const { error: updateError } = await supabase
      .from('user_plans')
      .update({
        payment_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update user plan status:', updateError);
      return res.status(500).json({ error: 'Failed to update subscription status' });
    }

    // Log the cancellation transaction
    try {
      await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          transaction_id: `cancel_${Date.now()}`,
          amount: 0,
          currency: 'ZAR',
          status: 'success',
          payment_method: 'subscription_cancellation',
          paystack_reference: `cancel_${userPlan.paystack_subscription_code}`,
          metadata: {
            type: 'subscription_cancellation',
            subscription_code: userPlan.paystack_subscription_code,
            cancelled_at: new Date().toISOString(),
            paystack_response: paystackResult
          }
        });
    } catch (auditError) {
      console.warn('Failed to log cancellation transaction:', auditError);
    }

    console.log(`✅ Subscription cancelled successfully for user: ${userId}`);
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Reactivate cancelled subscription
router.post('/reactivate-subscription', requireUser, async (req, res) => {
  try {
    const userId = (req as any).authenticatedUser.id;
    
    console.log(`🔄 Processing subscription reactivation for user: ${userId}`);
    
    // Get user's plan and subscription information
    const { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('paystack_subscription_code, payment_status, plan_type, paystack_customer_code')
      .eq('user_id', userId)
      .single();

    if (planError || !userPlan) {
      return res.status(404).json({ error: 'User plan not found' });
    }

    // Check if subscription can be reactivated
    if (userPlan.payment_status !== 'cancelled') {
      return res.status(400).json({ 
        error: 'Subscription not cancelled',
        message: 'Your subscription is not in a cancelled state'
      });
    }

    if (!userPlan.paystack_subscription_code) {
      return res.status(400).json({ 
        error: 'No subscription found',
        message: 'No subscription found to reactivate'
      });
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Payment system configuration error' });
    }

    // Enable the subscription with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/subscription/enable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: userPlan.paystack_subscription_code,
        token: 'reactivation_requested'
      })
    });

    if (!paystackResponse.ok) {
      const errorText = await paystackResponse.text();
      console.error('Paystack subscription reactivation failed:', errorText);
      return res.status(500).json({ error: 'Failed to reactivate subscription with payment processor' });
    }

    const paystackResult = await paystackResponse.json();
    
    if (!paystackResult.status) {
      console.error('Paystack reactivation response invalid:', paystackResult);
      return res.status(500).json({ error: 'Invalid response from payment processor' });
    }

    // Calculate next payment date (1 month from now)
    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    // Update user plan status to active
    const { error: updateError } = await supabase
      .from('user_plans')
      .update({
        payment_status: 'active',
        cancelled_at: null,
        next_payment_date: nextPaymentDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update user plan status:', updateError);
      return res.status(500).json({ error: 'Failed to update subscription status' });
    }

    // Log the reactivation transaction
    try {
      await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          transaction_id: `reactivate_${Date.now()}`,
          amount: 0,
          currency: 'ZAR',
          status: 'success',
          payment_method: 'subscription_reactivation',
          paystack_reference: `reactivate_${userPlan.paystack_subscription_code}`,
          metadata: {
            type: 'subscription_reactivation',
            subscription_code: userPlan.paystack_subscription_code,
            reactivated_at: new Date().toISOString(),
            next_payment_date: nextPaymentDate.toISOString(),
            paystack_response: paystackResult
          }
        });
    } catch (auditError) {
      console.warn('Failed to log reactivation transaction:', auditError);
    }

    console.log(`✅ Subscription reactivated successfully for user: ${userId}`);
    
    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      status: 'active',
      next_payment_date: nextPaymentDate.toISOString(),
      reactivated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error reactivating subscription:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

export default router;