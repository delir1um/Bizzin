// Grace Period Service - Manage 7-day grace periods after payment failures
import { supabase } from '../lib/supabase.js';
import type { PaymentStatus } from '../../client/src/types/plans.js';

export class GracePeriodService {
  
  // Initialize grace period when payment fails
  static async startGracePeriod(userId: string, failureReason?: string): Promise<{
    success: boolean;
    message: string;
    gracePeriodEnd?: string;
  }> {
    try {
      console.log(`🏃‍♂️ Starting grace period for user: ${userId}`);

      // Get current user plan
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

      // Only start grace period for premium users
      if (userPlan.plan_type !== 'premium') {
        return {
          success: false,
          message: 'Grace periods only apply to premium subscriptions'
        };
      }

      // Calculate grace period end (7 days from now)
      const gracePeriodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Update user plan with grace period status
      const { error: updateError } = await supabase
        .from('user_plans')
        .update({
          payment_status: 'grace_period',
          grace_period_end: gracePeriodEnd.toISOString(),
          failed_payment_count: (userPlan.failed_payment_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to start grace period:', updateError);
        return {
          success: false,
          message: `Failed to update plan: ${updateError.message}`
        };
      }

      // Record grace period start in payment transactions
      try {
        await supabase
          .from('payment_transactions')
          .insert({
            user_id: userId,
            transaction_id: `grace_start_${Date.now()}_${userId.substring(0, 8)}`,
            amount: 0,
            currency: 'ZAR',
            status: 'failed',
            payment_method: 'paystack',
            failure_reason: failureReason || 'Payment failed - grace period started',
            metadata: {
              type: 'grace_period_start',
              grace_period_end: gracePeriodEnd.toISOString(),
              failed_payment_count: (userPlan.failed_payment_count || 0) + 1
            }
          });
      } catch (auditError) {
        console.warn('Failed to record grace period start:', auditError);
      }

      console.log(`✅ Grace period started for user ${userId}, expires: ${gracePeriodEnd.toISOString()}`);

      return {
        success: true,
        message: 'Grace period started successfully',
        gracePeriodEnd: gracePeriodEnd.toISOString()
      };

    } catch (error) {
      console.error('Error starting grace period:', error);
      return {
        success: false,
        message: `Failed to start grace period: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Process expired grace periods and suspend accounts
  static async processExpiredGracePeriods(): Promise<{
    success: boolean;
    processed: number;
    suspended: number;
    errors: Array<{ userId: string; error: string }>;
  }> {
    try {
      console.log('🔍 Processing expired grace periods...');

      // Find all accounts with expired grace periods
      const { data: expiredPlans, error: queryError } = await supabase
        .from('user_plans')
        .select('user_id, grace_period_end, failed_payment_count')
        .eq('payment_status', 'grace_period')
        .lte('grace_period_end', new Date().toISOString());

      if (queryError) {
        console.error('Failed to query expired grace periods:', queryError);
        return {
          success: false,
          processed: 0,
          suspended: 0,
          errors: [{ userId: 'query', error: queryError.message }]
        };
      }

      if (!expiredPlans || expiredPlans.length === 0) {
        console.log('✅ No expired grace periods found');
        return {
          success: true,
          processed: 0,
          suspended: 0,
          errors: []
        };
      }

      console.log(`📊 Found ${expiredPlans.length} expired grace periods to process`);

      const results = {
        processed: 0,
        suspended: 0,
        errors: [] as Array<{ userId: string; error: string }>
      };

      // Process each expired grace period
      for (const plan of expiredPlans) {
        try {
          results.processed++;

          // Suspend the account
          const { error: suspendError } = await supabase
            .from('user_plans')
            .update({
              payment_status: 'suspended',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', plan.user_id);

          if (suspendError) {
            results.errors.push({
              userId: plan.user_id,
              error: `Failed to suspend account: ${suspendError.message}`
            });
            continue;
          }

          // Record suspension in payment transactions
          try {
            await supabase
              .from('payment_transactions')
              .insert({
                user_id: plan.user_id,
                transaction_id: `suspend_${Date.now()}_${plan.user_id.substring(0, 8)}`,
                amount: 0,
                currency: 'ZAR',
                status: 'cancelled',
                payment_method: 'paystack',
                failure_reason: 'Grace period expired - account suspended',
                metadata: {
                  type: 'account_suspension',
                  grace_period_expired: plan.grace_period_end,
                  failed_payment_count: plan.failed_payment_count,
                  suspension_date: new Date().toISOString()
                }
              });
          } catch (auditError) {
            console.warn(`Failed to record suspension for user ${plan.user_id}:`, auditError);
          }

          results.suspended++;
          console.log(`⛔ Suspended account for user ${plan.user_id} (grace period expired)`);

        } catch (error) {
          results.errors.push({
            userId: plan.user_id,
            error: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      console.log(`✅ Grace period processing complete: ${results.suspended} suspended, ${results.errors.length} errors`);

      return {
        success: results.errors.length === 0,
        ...results
      };

    } catch (error) {
      console.error('Error processing expired grace periods:', error);
      return {
        success: false,
        processed: 0,
        suspended: 0,
        errors: [{ userId: 'system', error: error instanceof Error ? error.message : 'Unknown error' }]
      };
    }
  }

  // Restore user from suspension when payment is successful
  static async restoreFromSuspension(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log(`🔄 Restoring user from suspension: ${userId}`);

      // Update user plan to active status
      const { error: updateError } = await supabase
        .from('user_plans')
        .update({
          payment_status: 'active',
          failed_payment_count: 0,
          grace_period_end: null,
          last_payment_date: new Date().toISOString(),
          next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to restore from suspension:', updateError);
        return {
          success: false,
          message: `Failed to update plan: ${updateError.message}`
        };
      }

      // Record restoration in payment transactions
      try {
        await supabase
          .from('payment_transactions')
          .insert({
            user_id: userId,
            transaction_id: `restore_${Date.now()}_${userId.substring(0, 8)}`,
            amount: 0,
            currency: 'ZAR',
            status: 'success',
            payment_method: 'paystack',
            metadata: {
              type: 'account_restoration',
              restored_from: 'suspended',
              restoration_date: new Date().toISOString()
            }
          });
      } catch (auditError) {
        console.warn('Failed to record account restoration:', auditError);
      }

      console.log(`✅ User ${userId} restored from suspension`);

      return {
        success: true,
        message: 'Account restored successfully'
      };

    } catch (error) {
      console.error('Error restoring from suspension:', error);
      return {
        success: false,
        message: `Failed to restore account: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get grace period status for a user
  static async getGracePeriodStatus(userId: string): Promise<{
    isInGracePeriod: boolean;
    gracePeriodEnd?: string;
    daysRemaining?: number;
    failedPaymentCount?: number;
  }> {
    try {
      const { data: userPlan } = await supabase
        .from('user_plans')
        .select('payment_status, grace_period_end, failed_payment_count')
        .eq('user_id', userId)
        .single();

      if (!userPlan) {
        return { isInGracePeriod: false };
      }

      const isInGracePeriod = userPlan.payment_status === 'grace_period' &&
                              userPlan.grace_period_end &&
                              new Date(userPlan.grace_period_end) > new Date();

      const daysRemaining = userPlan.grace_period_end 
        ? Math.max(0, Math.ceil((new Date(userPlan.grace_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      return {
        isInGracePeriod,
        gracePeriodEnd: userPlan.grace_period_end,
        daysRemaining,
        failedPaymentCount: userPlan.failed_payment_count
      };

    } catch (error) {
      console.error('Error getting grace period status:', error);
      return { isInGracePeriod: false };
    }
  }

  // Admin function to manually extend grace period
  static async extendGracePeriod(userId: string, additionalDays: number): Promise<{
    success: boolean;
    message: string;
    newGracePeriodEnd?: string;
  }> {
    try {
      console.log(`🔧 Admin extending grace period for user ${userId} by ${additionalDays} days`);

      const { data: userPlan } = await supabase
        .from('user_plans')
        .select('grace_period_end, payment_status')
        .eq('user_id', userId)
        .single();

      if (!userPlan) {
        return {
          success: false,
          message: 'User plan not found'
        };
      }

      // Calculate new grace period end
      const currentEnd = userPlan.grace_period_end ? new Date(userPlan.grace_period_end) : new Date();
      const newGracePeriodEnd = new Date(currentEnd.getTime() + additionalDays * 24 * 60 * 60 * 1000);

      // Update the grace period
      const { error: updateError } = await supabase
        .from('user_plans')
        .update({
          payment_status: 'grace_period',
          grace_period_end: newGracePeriodEnd.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        return {
          success: false,
          message: `Failed to extend grace period: ${updateError.message}`
        };
      }

      console.log(`✅ Grace period extended for user ${userId} until ${newGracePeriodEnd.toISOString()}`);

      return {
        success: true,
        message: `Grace period extended by ${additionalDays} days`,
        newGracePeriodEnd: newGracePeriodEnd.toISOString()
      };

    } catch (error) {
      console.error('Error extending grace period:', error);
      return {
        success: false,
        message: `Failed to extend grace period: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}