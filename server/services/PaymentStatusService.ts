// Payment Status Service - Sync Paystack subscription status with local database
import { supabase } from '../lib/supabase.js';
import type { PaymentStatus, PaymentTransaction } from '../../client/src/types/plans.js';

export class PaymentStatusService {
  private static paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  private static paystackBaseUrl = 'https://api.paystack.co';

  // Helper to make authenticated Paystack API calls
  private static async paystackRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) {
    if (!this.paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY not configured');
    }

    const url = `${this.paystackBaseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.paystackSecretKey}`,
      'Content-Type': 'application/json',
    };

    console.log(`📡 Paystack API ${method} ${endpoint}`);
    
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Paystack API error: ${response.status} ${errorText}`);
      throw new Error(`Paystack API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result;
  }

  // Sync a single user's subscription status from Paystack
  static async syncUserSubscriptionStatus(userId: string): Promise<{
    success: boolean;
    message: string;
    syncedData?: any;
  }> {
    try {
      console.log(`🔄 Syncing subscription status for user: ${userId}`);

      // Get user's current plan from database
      const { data: userPlan, error: planError } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (planError || !userPlan) {
        return {
          success: false,
          message: `User plan not found: ${planError?.message || 'No plan exists'}`
        };
      }

      // If no Paystack subscription code, nothing to sync
      if (!userPlan.paystack_subscription_code) {
        return {
          success: true,
          message: 'No Paystack subscription to sync (free/trial plan)'
        };
      }

      // Fetch subscription details from Paystack
      const paystackSubscription = await this.paystackRequest(
        `/subscription/${userPlan.paystack_subscription_code}`
      );

      if (!paystackSubscription.status) {
        return {
          success: false,
          message: 'Failed to fetch subscription from Paystack'
        };
      }

      const subscriptionData = paystackSubscription.data;
      console.log(`📊 Paystack subscription data:`, {
        status: subscriptionData.status,
        next_payment_date: subscriptionData.next_payment_date,
        amount: subscriptionData.amount
      });

      // Map Paystack status to our payment status
      const paymentStatus = this.mapPaystackStatusToLocal(subscriptionData.status);
      
      // Prepare update data
      const updateData: any = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      };

      // Set payment dates from Paystack
      if (subscriptionData.next_payment_date) {
        updateData.next_payment_date = new Date(subscriptionData.next_payment_date).toISOString();
      }

      // Reset failed payment count if subscription is active
      if (paymentStatus === 'active') {
        updateData.failed_payment_count = 0;
        updateData.grace_period_end = null;
        // Update last payment date for active subscriptions
        updateData.last_payment_date = new Date().toISOString();
      } else if (paymentStatus === 'cancelled') {
        // Clear next payment date for cancelled subscriptions
        updateData.next_payment_date = null;
      }

      // Update customer code if available
      if (subscriptionData.customer?.customer_code) {
        updateData.paystack_customer_code = subscriptionData.customer.customer_code;
      }

      // Update the user plan
      const { error: updateError } = await supabase
        .from('user_plans')
        .update(updateData)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to update user plan:', updateError);
        return {
          success: false,
          message: `Database update failed: ${updateError.message}`
        };
      }

      // Record sync operation in payment transactions for audit trail
      try {
        await supabase
          .from('payment_transactions')
          .insert({
            user_id: userId,
            transaction_id: `sync_${Date.now()}_${userId.substring(0, 8)}`,
            amount: subscriptionData.amount ? subscriptionData.amount / 100 : 0,
            currency: 'ZAR',
            status: paymentStatus === 'active' ? 'success' : 'cancelled',
            payment_method: 'paystack',
            subscription_id: subscriptionData.subscription_code,
            metadata: {
              type: 'status_sync',
              paystack_status: subscriptionData.status,
              sync_timestamp: new Date().toISOString()
            }
          });
      } catch (auditError) {
        // Don't fail the sync if audit logging fails, but log the issue
        console.warn('Failed to record sync in payment transactions:', auditError);
      }

      console.log(`✅ Synced subscription status for user ${userId}: ${paymentStatus}`);
      
      return {
        success: true,
        message: `Subscription status synced successfully: ${paymentStatus}`,
        syncedData: {
          paystack_status: subscriptionData.status,
          local_status: paymentStatus,
          next_payment_date: subscriptionData.next_payment_date,
          amount: subscriptionData.amount
        }
      };

    } catch (error) {
      console.error('Error syncing subscription status:', error);
      return {
        success: false,
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Sync all active subscriptions (for batch operations)
  static async syncAllActiveSubscriptions(): Promise<{
    success: boolean;
    message: string;
    results: Array<{ userId: string; success: boolean; message: string }>;
  }> {
    try {
      console.log('🔄 Starting batch sync of all active subscriptions...');

      // Get all user plans with Paystack subscriptions
      const { data: userPlans, error: plansError } = await supabase
        .from('user_plans')
        .select('user_id, paystack_subscription_code, plan_type')
        .not('paystack_subscription_code', 'is', null)
        .eq('plan_type', 'premium');

      if (plansError) {
        return {
          success: false,
          message: `Failed to fetch user plans: ${plansError.message}`,
          results: []
        };
      }

      if (!userPlans || userPlans.length === 0) {
        return {
          success: true,
          message: 'No active subscriptions to sync',
          results: []
        };
      }

      console.log(`📊 Found ${userPlans.length} subscriptions to sync`);

      // Sync each subscription with rate limiting
      const results = [];
      for (const plan of userPlans) {
        const result = await this.syncUserSubscriptionStatus(plan.user_id);
        results.push({
          userId: plan.user_id,
          success: result.success,
          message: result.message
        });

        // Rate limiting: wait 200ms between API calls
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return {
        success: failureCount === 0,
        message: `Batch sync completed: ${successCount} successful, ${failureCount} failed`,
        results
      };

    } catch (error) {
      console.error('Error in batch subscription sync:', error);
      return {
        success: false,
        message: `Batch sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: []
      };
    }
  }

  // Get payment transaction history for a user from Paystack
  static async getPaymentHistory(userId: string, limit: number = 20): Promise<{
    success: boolean;
    transactions: any[];
    message: string;
  }> {
    try {
      // Get user's email for transaction filtering (Paystack uses email, not customer code for transaction filtering)
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('user_id', userId)
        .single();

      if (!userProfile?.email) {
        return {
          success: false,
          transactions: [],
          message: 'User profile or email not found'
        };
      }

      // Fetch transactions from Paystack using email filter
      const response = await this.paystackRequest(
        `/transaction?customer=${encodeURIComponent(userProfile.email)}&perPage=${limit}`
      );

      if (!response.status) {
        return {
          success: false,
          transactions: [],
          message: 'Failed to fetch payment history from Paystack'
        };
      }

      return {
        success: true,
        transactions: response.data || [],
        message: `Retrieved ${response.data?.length || 0} transactions`
      };

    } catch (error) {
      console.error('Error fetching payment history:', error);
      return {
        success: false,
        transactions: [],
        message: `Failed to fetch payment history: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Check subscription health (grace periods, failed payments, etc.)
  static async checkSubscriptionHealth(): Promise<{
    healthy: number;
    grace_period: number;
    suspended: number;
    failed_payments: number;
    details: Array<{
      userId: string;
      status: PaymentStatus;
      issue: string;
      action_needed: string;
    }>;
  }> {
    try {
      const { data: userPlans, error } = await supabase
        .from('user_plans')
        .select('user_id, payment_status, failed_payment_count, grace_period_end, next_payment_date')
        .eq('plan_type', 'premium');

      if (error || !userPlans) {
        throw new Error(`Failed to fetch user plans: ${error?.message}`);
      }

      const stats = {
        healthy: 0,
        grace_period: 0,
        suspended: 0,
        failed_payments: 0,
        details: [] as any[]
      };

      const now = new Date();

      for (const plan of userPlans) {
        let issue = '';
        let action_needed = '';

        switch (plan.payment_status) {
          case 'active':
            // Check if payment is overdue
            if (plan.next_payment_date && new Date(plan.next_payment_date) < now) {
              issue = 'Payment overdue';
              action_needed = 'Trigger manual payment check';
              stats.failed_payments++;
            } else {
              stats.healthy++;
            }
            break;

          case 'grace_period':
            if (plan.grace_period_end && new Date(plan.grace_period_end) < now) {
              issue = 'Grace period expired';
              action_needed = 'Suspend account';
            } else {
              issue = 'In grace period';
              action_needed = 'Monitor and retry payment';
            }
            stats.grace_period++;
            break;

          case 'suspended':
            issue = 'Account suspended';
            action_needed = 'User needs to update payment method';
            stats.suspended++;
            break;

          case 'failed':
            issue = `${plan.failed_payment_count || 0} failed payments`;
            action_needed = 'Retry payment or enter grace period';
            stats.failed_payments++;
            break;

          default:
            stats.healthy++;
        }

        if (issue) {
          stats.details.push({
            userId: plan.user_id,
            status: plan.payment_status,
            issue,
            action_needed
          });
        }
      }

      return stats;

    } catch (error) {
      console.error('Error checking subscription health:', error);
      throw error;
    }
  }

  // Map Paystack subscription status to our local payment status
  private static mapPaystackStatusToLocal(paystackStatus: string): PaymentStatus {
    switch (paystackStatus.toLowerCase()) {
      case 'active':
        return 'active';
      case 'non-renewing':
      case 'cancelled':
        return 'cancelled';
      case 'attention':
        return 'failed';
      default:
        console.warn(`Unknown Paystack status: ${paystackStatus}, defaulting to 'pending'`);
        return 'pending';
    }
  }

  // Manual payment method removed for security reasons
  // Use Paystack dashboard for manual operations or implement proper payment initialization flow
}