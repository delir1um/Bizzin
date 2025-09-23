// Paystack Webhook Routes - Handle subscription and payment events
import express from 'express';
import crypto from 'crypto';
import { supabase } from '../lib/supabase.js';
import type { PaymentTransaction, PaymentStatus } from '../../client/src/types/plans.js';

const router = express.Router();

// Middleware to verify Paystack webhook signature
const verifyPaystackSignature = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!paystackSecretKey) {
      console.error('🚨 PAYSTACK_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Webhook configuration error' });
    }

    const hash = crypto
      .createHmac('sha512', paystackSecretKey)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const signature = req.headers['x-paystack-signature'] as string;

    if (hash !== signature) {
      console.error('🚨 Invalid Paystack webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('✅ Paystack webhook signature verified');
    next();
  } catch (error) {
    console.error('🚨 Webhook signature verification failed:', error);
    res.status(401).json({ error: 'Signature verification failed' });
  }
};

// Rate limiting middleware for webhook endpoint
const webhookRateLimit = (() => {
  const attempts = new Map<string, { count: number; resetTime: number }>();
  const maxAttempts = 100; // Max 100 webhooks per minute per IP
  const windowMs = 60 * 1000; // 1 minute

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const clientAttempts = attempts.get(clientIp) || { count: 0, resetTime: now + windowMs };

    if (now > clientAttempts.resetTime) {
      clientAttempts.count = 0;
      clientAttempts.resetTime = now + windowMs;
    }

    clientAttempts.count++;
    attempts.set(clientIp, clientAttempts);

    if (clientAttempts.count > maxAttempts) {
      console.warn(`🚨 Rate limit exceeded for webhook from IP: ${clientIp}`);
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    next();
  };
})();

// Helper function to log webhook events for debugging
const logWebhookEvent = async (event: string, data: any, userId?: string) => {
  try {
    console.log(`📥 Webhook Event: ${event}`, {
      event,
      reference: data.reference,
      amount: data.amount,
      status: data.status,
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log webhook event:', error);
  }
};

// Helper function to update user plan status
const updateUserPlanStatus = async (
  userId: string, 
  paymentStatus: PaymentStatus, 
  transactionData: any
) => {
  try {
    const updateData: any = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };

    // Set payment dates based on event type
    if (paymentStatus === 'active') {
      updateData.last_payment_date = new Date().toISOString();
      updateData.next_payment_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
      updateData.failed_payment_count = 0;
      updateData.grace_period_end = null;
    } else if (paymentStatus === 'failed') {
      // Increment failed payment count
      const { data: currentPlan } = await supabase
        .from('user_plans')
        .select('failed_payment_count')
        .eq('user_id', userId)
        .single();
      
      const failedCount = (currentPlan?.failed_payment_count || 0) + 1;
      updateData.failed_payment_count = failedCount;
      
      // Set grace period if this is the first failure
      if (failedCount === 1) {
        updateData.grace_period_end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
        updateData.payment_status = 'grace_period';
      } else if (failedCount >= 3) {
        updateData.payment_status = 'suspended';
        updateData.grace_period_end = null;
      }
    }

    // Store Paystack subscription details
    if (transactionData.subscription_code) {
      updateData.paystack_subscription_code = transactionData.subscription_code;
    }
    if (transactionData.customer_code) {
      updateData.paystack_customer_code = transactionData.customer_code;
    }

    const { error } = await supabase
      .from('user_plans')
      .update(updateData)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to update user plan:', error);
      return false;
    }

    console.log(`✅ Updated user plan status to ${paymentStatus} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error updating user plan status:', error);
    return false;
  }
};

// Helper function to record payment transaction
const recordPaymentTransaction = async (
  userId: string,
  transactionData: any,
  status: 'pending' | 'success' | 'failed' | 'cancelled'
) => {
  try {
    const transaction: Partial<PaymentTransaction> = {
      user_id: userId,
      transaction_id: transactionData.reference,
      amount: transactionData.amount / 100, // Paystack amounts are in kobo
      currency: transactionData.currency || 'ZAR',
      status,
      payment_method: 'paystack',
      paystack_reference: transactionData.reference,
      paystack_authorization_code: transactionData.authorization?.authorization_code,
      subscription_id: transactionData.subscription_code,
      failure_reason: status === 'failed' ? transactionData.gateway_response : null,
      metadata: {
        channel: transactionData.channel,
        ip_address: transactionData.ip_address,
        paystack_fees: transactionData.fees,
        gateway_response: transactionData.gateway_response
      }
    };

    const { error } = await supabase
      .from('payment_transactions')
      .insert([transaction]);

    if (error) {
      console.error('Failed to record payment transaction:', error);
      return false;
    }

    console.log(`✅ Recorded payment transaction: ${transactionData.reference}`);
    return true;
  } catch (error) {
    console.error('Error recording payment transaction:', error);
    return false;
  }
};

// Helper function to find user by Paystack customer code or email
const findUserByPaystackData = async (transactionData: any): Promise<string | null> => {
  try {
    // First try to find by customer email
    if (transactionData.customer?.email) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', transactionData.customer.email)
        .single();
      
      if (userProfile) {
        return userProfile.user_id;
      }
    }

    // Then try to find by stored Paystack customer code
    if (transactionData.customer_code) {
      const { data: userPlan } = await supabase
        .from('user_plans')
        .select('user_id')
        .eq('paystack_customer_code', transactionData.customer_code)
        .single();
      
      if (userPlan) {
        return userPlan.user_id;
      }
    }

    console.warn('Could not find user for Paystack transaction:', {
      customer_email: transactionData.customer?.email,
      customer_code: transactionData.customer_code,
      reference: transactionData.reference
    });
    
    return null;
  } catch (error) {
    console.error('Error finding user by Paystack data:', error);
    return null;
  }
};

// Main webhook endpoint
router.post('/webhook', 
  express.raw({ type: 'application/json' }),
  webhookRateLimit,
  verifyPaystackSignature,
  async (req, res) => {
    try {
      const event = req.body;
      await logWebhookEvent(event.event, event.data);

      switch (event.event) {
        case 'charge.success':
          await handleChargeSuccess(event.data);
          break;
          
        case 'subscription.create':
          await handleSubscriptionCreate(event.data);
          break;
          
        case 'invoice.create':
        case 'invoice.update':
          await handleInvoiceEvent(event.data);
          break;
          
        case 'subscription.disable':
        case 'subscription.not_renew':
          await handleSubscriptionDisable(event.data);
          break;
          
        default:
          console.log(`📋 Unhandled webhook event: ${event.event}`);
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('🚨 Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

// Handle successful charges
const handleChargeSuccess = async (data: any) => {
  const userId = await findUserByPaystackData(data);
  
  if (!userId) {
    console.error('Cannot process charge.success: User not found');
    return;
  }

  await recordPaymentTransaction(userId, data, 'success');
  await updateUserPlanStatus(userId, 'active', data);
  
  console.log(`✅ Processed successful charge for user ${userId}: ${data.reference}`);
};

// Handle subscription creation
const handleSubscriptionCreate = async (data: any) => {
  const userId = await findUserByPaystackData(data);
  
  if (!userId) {
    console.error('Cannot process subscription.create: User not found');
    return;
  }

  // Update user plan with subscription details
  const { error } = await supabase
    .from('user_plans')
    .update({
      paystack_subscription_code: data.subscription_code,
      paystack_customer_code: data.customer_code,
      payment_status: 'active',
      plan_type: 'premium',
      next_payment_date: new Date(data.next_payment_date).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to update subscription details:', error);
    return;
  }

  console.log(`✅ Processed subscription creation for user ${userId}: ${data.subscription_code}`);
};

// Handle invoice events (payment attempts)
const handleInvoiceEvent = async (data: any) => {
  const userId = await findUserByPaystackData(data);
  
  if (!userId) {
    console.error('Cannot process invoice event: User not found');
    return;
  }

  if (data.status === 'success') {
    await recordPaymentTransaction(userId, data, 'success');
    await updateUserPlanStatus(userId, 'active', data);
  } else if (data.status === 'failed') {
    await recordPaymentTransaction(userId, data, 'failed');
    await updateUserPlanStatus(userId, 'failed', data);
  }

  console.log(`✅ Processed invoice ${data.status} for user ${userId}: ${data.invoice_code}`);
};

// Handle subscription disable/cancellation
const handleSubscriptionDisable = async (data: any) => {
  const userId = await findUserByPaystackData(data);
  
  if (!userId) {
    console.error('Cannot process subscription disable: User not found');
    return;
  }

  await updateUserPlanStatus(userId, 'cancelled', data);
  
  // Update cancellation date
  await supabase
    .from('user_plans')
    .update({
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  console.log(`✅ Processed subscription cancellation for user ${userId}: ${data.subscription_code}`);
};

// Health check endpoint for webhook monitoring
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhook_endpoint: '/api/paystack/webhook'
  });
});

export default router;