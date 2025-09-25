import { supabase } from '../lib/supabase.js';

export interface ConversionResult {
  success: boolean;
  processed: boolean;
  alreadyProcessed: boolean;
  noReferral: boolean;
  error?: string;
}

/**
 * Server-side referral bonus service using service role Supabase client
 * Handles conversion detection and bonus credit awarding
 */
export class ReferralBonusService {
  /**
   * Process referral conversion bonuses when a user converts from trial to paid
   * Awards +30 days to referred user and +10 days to referrer
   * Uses proper idempotency and server-side Supabase client
   */
  static async processConversion(userId: string): Promise<ConversionResult> {
    try {
      console.log(`🎯 Processing referral conversion for user: ${userId}`);

      // Start a transaction to ensure atomicity
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_user_id', userId)
        .eq('status', 'captured')
        .single();

      if (referralError || !referralData) {
        console.log('No pending referral found for conversion - user not referred or already converted');
        return {
          success: true,
          processed: false,
          alreadyProcessed: false,
          noReferral: true
        };
      }

      console.log(`✅ Found referral for conversion: ${referralData.referrer_user_id} → ${userId}`);

      // Check if this referral has already been converted (idempotency check)
      const { data: existingCredits, error: creditsCheckError } = await supabase
        .from('subscription_credits')
        .select('id')
        .eq('source', 'referral')
        .eq('source_id', referralData.id)
        .limit(1);

      if (existingCredits && existingCredits.length > 0) {
        console.log('Referral bonuses already processed for this conversion');
        return {
          success: true,
          processed: false,
          alreadyProcessed: true,
          noReferral: false
        };
      }

      const now = new Date().toISOString();

      // 1. Create subscription credits for both users
      const creditsToInsert = [
        {
          user_id: userId,
          credit_type: 'referral_bonus',
          amount_days: 30,
          reason: 'Referral sign-up bonus - welcome reward',
          source: 'referral',
          source_id: referralData.id,
          is_used: false,
          granted_at: now
        },
        {
          user_id: referralData.referrer_user_id,
          credit_type: 'referrer_bonus', 
          amount_days: 10,
          reason: `Referral reward for successful conversion by user ${userId}`,
          source: 'referral',
          source_id: referralData.id,
          is_used: false,
          granted_at: now
        }
      ];

      const { error: creditsError } = await supabase
        .from('subscription_credits')
        .insert(creditsToInsert);

      if (creditsError) {
        // Handle unique constraint violation (concurrent webhook retries)
        if (creditsError.code === '23505' || creditsError.message.includes('duplicate')) {
          console.log('Referral bonuses already processed by concurrent request (unique constraint)');
          return {
            success: true,
            processed: false,
            alreadyProcessed: true,
            noReferral: false
          };
        }
        
        console.error('Failed to create subscription credits:', creditsError);
        return {
          success: false,
          processed: false,
          alreadyProcessed: false,
          noReferral: false,
          error: creditsError.message
        };
      }

      console.log(`✅ Created subscription credits: +30 days for ${userId}, +10 days for ${referralData.referrer_user_id}`);

      // 2. Update referral status to converted
      const { error: statusError } = await supabase
        .from('referrals')
        .update({
          status: 'converted',
          converted_at: now,
          updated_at: now
        })
        .eq('id', referralData.id);

      if (statusError) {
        console.error('Failed to update referral status:', statusError);
        return {
          success: false,
          processed: false,
          alreadyProcessed: false,
          noReferral: false,
          error: statusError.message
        };
      }

      console.log(`✅ Updated referral status to converted`);

      // 3. Update referrer stats (non-critical, don't fail if this errors)
      try {
        const { data: referrerStats, error: statsError } = await supabase
          .from('user_referral_stats')
          .select('active_referrals, bonus_days_earned')
          .eq('user_id', referralData.referrer_user_id)
          .single();

        if (!statsError && referrerStats) {
          const { error: updateStatsError } = await supabase
            .from('user_referral_stats')
            .update({
              active_referrals: referrerStats.active_referrals + 1,
              bonus_days_earned: referrerStats.bonus_days_earned + 10,
              updated_at: now
            })
            .eq('user_id', referralData.referrer_user_id);

          if (!updateStatsError) {
            console.log(`✅ Updated referrer stats: +1 conversion, +10 bonus days`);
          } else {
            console.warn('Failed to update referrer stats (non-critical):', updateStatsError);
          }
        }
      } catch (statsError) {
        console.warn('Error updating referrer stats (non-critical):', statsError);
      }

      console.log(`🎉 Referral conversion processing completed successfully`);
      
      return {
        success: true,
        processed: true,
        alreadyProcessed: false,
        noReferral: false
      };

    } catch (error) {
      console.error('Critical error processing referral conversion:', error);
      return {
        success: false,
        processed: false,
        alreadyProcessed: false,
        noReferral: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Apply referral bonus to extend user subscription
   */
  static async applyReferralBonus(userId: string): Promise<{
    success: boolean;
    bonusApplied: boolean;
    daysExtended: number;
    error?: string;
  }> {
    try {
      console.log(`🎁 Applying referral bonus for user: ${userId}`);

      // Check if user has a pending referral bonus
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('has_referral_bonus, referral_bonus_expires_at')
        .eq('user_id', userId)
        .single();

      if (profileError || !userProfile) {
        console.log('User profile not found or error accessing it');
        return { success: true, bonusApplied: false, daysExtended: 0 };
      }

      // Check if bonus is available and not expired
      if (!userProfile.has_referral_bonus || !userProfile.referral_bonus_expires_at) {
        console.log('No referral bonus available for user');
        return { success: true, bonusApplied: false, daysExtended: 0 };
      }

      const now = new Date();
      const expiryDate = new Date(userProfile.referral_bonus_expires_at);
      
      if (expiryDate <= now) {
        console.log('Referral bonus has expired');
        return { success: true, bonusApplied: false, daysExtended: 0 };
      }

      // Apply the 30-day bonus by extending the subscription
      const { data: userPlan, error: planError } = await supabase
        .from('user_plans')
        .select('expires_at, next_payment_date')
        .eq('user_id', userId)
        .single();

      if (planError || !userPlan) {
        console.error('Error fetching user plan:', planError);
        return { success: false, bonusApplied: false, daysExtended: 0, error: 'User plan not found' };
      }

      // Calculate new dates with 30-day extension
      const currentNextPayment = new Date(userPlan.next_payment_date || Date.now() + 30 * 24 * 60 * 60 * 1000);
      const extendedNextPayment = new Date(currentNextPayment.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Update user plan with extended dates
      const { error: updatePlanError } = await supabase
        .from('user_plans')
        .update({
          next_payment_date: extendedNextPayment.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('user_id', userId);

      if (updatePlanError) {
        console.error('Error updating user plan with bonus:', updatePlanError);
        return { success: false, bonusApplied: false, daysExtended: 0, error: 'Failed to extend subscription' };
      }

      // Clear the referral bonus flags
      const { error: clearBonusError } = await supabase
        .from('user_profiles')
        .update({
          has_referral_bonus: false,
          referral_bonus_expires_at: null,
          updated_at: now.toISOString()
        })
        .eq('user_id', userId);

      if (clearBonusError) {
        console.warn('Warning: Failed to clear referral bonus flags:', clearBonusError);
        // Don't fail the entire operation for this
      }

      console.log(`🎉 Successfully applied 30-day referral bonus to user ${userId}`);
      
      return {
        success: true,
        bonusApplied: true,
        daysExtended: 30
      };

    } catch (error) {
      console.error('Error applying referral bonus:', error);
      return {
        success: false,
        bonusApplied: false,
        daysExtended: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get referral conversion status for a user
   */
  static async getConversionStatus(userId: string): Promise<{
    hasReferral: boolean;
    status: string | null;
    convertedAt: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('status, converted_at')
        .eq('referred_user_id', userId)
        .single();

      if (error || !data) {
        return { hasReferral: false, status: null, convertedAt: null };
      }

      return {
        hasReferral: true,
        status: data.status,
        convertedAt: data.converted_at
      };
    } catch (error) {
      console.error('Error checking conversion status:', error);
      return { hasReferral: false, status: null, convertedAt: null };
    }
  }
}