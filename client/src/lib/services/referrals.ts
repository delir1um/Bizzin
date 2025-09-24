import { supabase } from '@/lib/supabase'

export interface ReferralStats {
  referral_code: string
  total_referrals: number
  active_referrals: number
  bonus_days_earned: number
  bonus_days_used: number
  available_bonus_days: number
  subscription_extension_until: Date | null
}

export interface ReferralEntry {
  id: string
  referee_email: string
  is_active: boolean
  signup_date: string
  activation_date: string | null
  deactivation_date: string | null
}

export interface ReferralDashboard {
  user_id: string
  email: string
  referral_code: string
  total_referrals: number
  active_referrals: number
  bonus_days_earned: number
  bonus_days_used: number
  available_bonus_days: number
  plan_status: string
  subscription_end_date: string | null
  referral_extension_days: number
}

export class ReferralService {
  private static readonly PENDING_REFERRAL_KEY = 'pendingReferral'
  private static readonly TEMP_REFERRAL_KEY = 'tempReferralCode'

  /**
   * Store referral code persistently during signup process
   * Uses localStorage to survive page reloads and email confirmations
   */
  static setPendingReferral(userId: string, referralCode: string): void {
    const cleanCode = referralCode.trim().toUpperCase()
    // Store with user-specific key after signup
    localStorage.setItem(`${this.PENDING_REFERRAL_KEY}:${userId}`, cleanCode)
    // Also store as temp code before signup (backup)
    localStorage.setItem(this.TEMP_REFERRAL_KEY, cleanCode)
    console.log('📋 Stored pending referral code for user:', userId)
  }

  /**
   * Store temporary referral code before user is created
   * Used when user hasn't signed up yet
   */
  static setTemporaryReferralCode(referralCode: string): void {
    const cleanCode = referralCode.trim().toUpperCase()
    localStorage.setItem(this.TEMP_REFERRAL_KEY, cleanCode)
    console.log('📋 Stored temporary referral code')
  }

  /**
   * Get and remove pending referral for user
   * Checks both user-specific and temporary storage
   */
  static consumePendingReferral(userId: string): string | undefined {
    // Try user-specific key first
    let referralCode = localStorage.getItem(`${this.PENDING_REFERRAL_KEY}:${userId}`)
    if (referralCode) {
      localStorage.removeItem(`${this.PENDING_REFERRAL_KEY}:${userId}`)
      console.log('📋 Consumed user-specific referral code for:', userId)
      return referralCode
    }

    // Fallback to temporary storage
    referralCode = localStorage.getItem(this.TEMP_REFERRAL_KEY)
    if (referralCode) {
      localStorage.removeItem(this.TEMP_REFERRAL_KEY)
      console.log('📋 Consumed temporary referral code for:', userId)
      return referralCode
    }

    return undefined
  }

  /**
   * Clear all pending referral data (cleanup)
   */
  static clearPendingReferrals(): void {
    localStorage.removeItem(this.TEMP_REFERRAL_KEY)
    // Clear user-specific keys (basic cleanup)
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.PENDING_REFERRAL_KEY + ':')) {
        localStorage.removeItem(key)
      }
    })
  }

  /**
   * Get referrer user ID from referral code
   * Returns null if code is invalid or referrer not found
   */
  static async getReferrerUserId(referralCode: string): Promise<string | null> {
    if (!referralCode || referralCode.trim() === '') {
      return null
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('referral_code', referralCode.trim().toUpperCase())
      .single()

    if (error || !data) {
      return null
    }

    return data.user_id
  }
  /**
   * Generate a unique referral code for a user
   */
  static generateReferralCode(email: string): string {
    // Create a hash from email and timestamp for uniqueness
    const baseString = email.toLowerCase().replace(/[^a-z0-9]/g, '')
    const timestamp = Date.now().toString(36)
    const randomPart = Math.random().toString(36).substring(2, 8)
    
    // Take first 4 chars from email, 4 from timestamp, 2 random
    const code = (baseString.substring(0, 4) + timestamp.substring(-4) + randomPart.substring(0, 2)).toUpperCase()
    return code
  }

  /**
   * Initialize referral stats for a new user
   */
  static async initializeUserReferralStats(userId: string, email: string): Promise<boolean> {
    try {
      const referralCode = this.generateReferralCode(email)
      
      const { error } = await supabase
        .from('user_referral_stats')
        .insert({
          user_id: userId,
          referral_code: referralCode,
          total_referrals: 0,
          active_referrals: 0,
          bonus_days_earned: 0,
          bonus_days_used: 0
        })

      if (error) {
        console.error('Error initializing referral stats:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error in initializeUserReferralStats:', error)
      return false
    }
  }

  /**
   * Get user's referral statistics
   */
  static async getReferralStats(userId: string): Promise<ReferralStats | null> {
    const { data, error } = await supabase
      .from('user_referral_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching referral stats:', error)
      return null
    }

    return {
      referral_code: data.referral_code,
      total_referrals: data.total_referrals,
      active_referrals: data.active_referrals,
      bonus_days_earned: data.bonus_days_earned,
      bonus_days_used: data.bonus_days_used,
      available_bonus_days: data.bonus_days_earned - data.bonus_days_used,
      subscription_extension_until: data.subscription_extension_until ? new Date(data.subscription_extension_until) : null
    }
  }

  /**
   * Get user's referral dashboard data
   */
  static async getReferralDashboard(userId: string): Promise<ReferralDashboard | null> {
    const { data, error } = await supabase
      .from('user_referral_dashboard')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching referral dashboard:', error)
      return null
    }

    return data
  }

  /**
   * Get list of user's referrals using new schema
   */
  static async getUserReferrals(userId: string): Promise<ReferralEntry[]> {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        id,
        referred_user_id,
        status,
        created_at,
        converted_at,
        user_profiles!referrals_referred_user_id_fkey (email)
      `)
      .eq('referrer_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user referrals:', error)
      return []
    }

    // Map to ReferralEntry format
    return data.map(referral => ({
      id: referral.id,
      referee_email: (referral.user_profiles as any)?.email || `User ${referral.referred_user_id.substring(0, 8)}...`,
      is_active: referral.status === 'captured' || referral.status === 'converted',
      signup_date: referral.created_at,
      activation_date: referral.converted_at,
      deactivation_date: referral.status === 'invalid' ? referral.created_at : null
    }))
  }

  /**
   * Complete referral processing after user profile is created
   * This creates the referral record in the database
   */
  static async completeReferralSignup(newUserId: string, referrerUserId: string): Promise<boolean> {
    try {
      // Prevent self-referral
      if (referrerUserId === newUserId) {
        console.error('Self-referral not allowed')
        return false
      }

      // Check if user is already referred (one referral per user)
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_user_id', newUserId)
        .single()

      if (existingReferral) {
        console.log('User already has a referral record')
        return true // Don't error, just indicate it's already processed
      }

      // Create referral record using new schema
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_user_id: referrerUserId,
          referred_user_id: newUserId,
          status: 'captured' // Initial status until conversion
        })

      if (referralError) {
        // Handle unique constraint violations gracefully
        if (referralError.code === '23505') {
          console.log('Referral already exists (unique constraint)')
          return true
        }
        console.error('Error creating referral record:', referralError)
        return false
      }

      console.log(`✅ Referral captured: referrer ${referrerUserId} referred user ${newUserId}`)
      return true
    } catch (error) {
      console.error('Error completing referral signup:', error)
      return false
    }
  }

  /**
   * Legacy method for backward compatibility
   * Process a new user signup with referral code
   */
  static async processReferralSignup(referralCode: string, newUserId: string): Promise<boolean> {
    const referrerUserId = await this.getReferrerUserId(referralCode)
    if (!referrerUserId) {
      console.error('Invalid referral code:', referralCode)
      return false
    }

    // Prevent self-referral
    if (referrerUserId === newUserId) {
      console.error('Self-referral not allowed')
      return false
    }

    return await this.completeReferralSignup(newUserId, referrerUserId)
  }

  /**
   * Validate a referral code
   * Updated to use user_profiles table
   */
  static async validateReferralCode(referralCode: string): Promise<boolean> {
    if (!referralCode || referralCode.trim() === '') {
      return false
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('referral_code, user_id')
      .eq('referral_code', referralCode.trim().toUpperCase())
      .single()

    return !error && !!data
  }

  /**
   * Generate referral link for user
   */
  static generateReferralLink(referralCode: string): string {
    // Check if we have a custom deployment URL
    const deploymentUrl = import.meta.env.VITE_DEPLOYMENT_URL
    if (deploymentUrl) {
      return `${deploymentUrl}/auth?ref=${referralCode}`
    }
    
    // Auto-detect deployment URL based on current hostname
    const currentHostname = window.location.hostname
    let baseUrl = window.location.origin
    
    // Use current origin for referral links
    // This works for any deployment URL
    
    return `${baseUrl}/auth?ref=${referralCode}`
  }

  /**
   * Copy referral link to clipboard
   */
  static async copyReferralLink(referralCode: string): Promise<boolean> {
    try {
      const link = this.generateReferralLink(referralCode)
      await navigator.clipboard.writeText(link)
      return true
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      return false
    }
  }

  /**
   * Activate referral bonuses when referee converts from trial to paid plan
   * Gives 30 days bonus to referee and 10 days to referrer
   */
  static async activateReferralBonuses(refereeUserId: string): Promise<boolean> {
    try {
      // Find the referral record for this user
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referee_id', refereeUserId)
        .eq('is_active', false)
        .single()

      if (referralError || !referralData) {
        // User wasn't referred or referral already activated
        return true
      }

      // Get referee's current plan to check if referral bonus was already applied
      const { data: refereePlan, error: planError } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', refereeUserId)
        .single()

      if (planError || !refereePlan) {
        console.error('Error fetching referee plan:', planError)
        return false
      }

      // Only apply referral bonus if not already applied
      if (!refereePlan.referral_bonus_applied) {
        // Calculate new expiration date: current plan expiry + 30 days bonus
        let bonusExpiration: Date
        if (refereePlan.expires_at) {
          bonusExpiration = new Date(refereePlan.expires_at)
          bonusExpiration.setDate(bonusExpiration.getDate() + 30)
        } else {
          // Fallback - shouldn't happen with proper trial setup
          bonusExpiration = new Date()
          bonusExpiration.setDate(bonusExpiration.getDate() + 30)
        }

        // 1. Update the referee's plan with 30 days bonus
        const { error: planUpdateError } = await supabase
          .from('user_plans')
          .update({
            expires_at: bonusExpiration.toISOString(),
            referral_bonus_applied: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', refereeUserId)

        if (planUpdateError) {
          console.error('Error updating referee plan with bonus:', planUpdateError)
          return false
        }
      }

      // 2. Activate the referral record
      const { error: activationError } = await supabase
        .from('referrals')
        .update({
          is_active: true,
          activation_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', referralData.id)

      if (activationError) {
        console.error('Error activating referral record:', activationError)
        return false
      }

      // 3. Award 10 days bonus to the referrer
      const referrerBonusDays = 10
      const now = new Date()
      const { data: referrerStats, error: statsError } = await supabase
        .from('user_referral_stats')
        .select('*')
        .eq('user_id', referralData.referrer_id)
        .single()

      if (!statsError && referrerStats) {
        const newBonusDays = referrerStats.bonus_days_earned + referrerBonusDays
        const newActiveReferrals = referrerStats.active_referrals + 1

        // Update referrer's bonus stats
        const { error: referrerUpdateError } = await supabase
          .from('user_referral_stats')
          .update({
            active_referrals: newActiveReferrals,
            bonus_days_earned: newBonusDays,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', referralData.referrer_id)

        if (referrerUpdateError) {
          console.error('Error updating referrer bonus:', referrerUpdateError)
        }

        // 4. Apply bonus days to referrer's current plan if they have one
        const { data: referrerPlan } = await supabase
          .from('user_plans')
          .select('*')
          .eq('user_id', referralData.referrer_id)
          .single()

        if (referrerPlan && referrerPlan.plan_type === 'premium') {
          // Extend their existing premium plan by 10 days
          const currentExpiry = new Date(referrerPlan.expires_at || now)
          const extendedExpiry = new Date(currentExpiry.getTime() + (referrerBonusDays * 24 * 60 * 60 * 1000))
          
          await supabase
            .from('user_plans')
            .update({
              expires_at: extendedExpiry.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', referralData.referrer_id)
        }
      }

      return true
    } catch (error) {
      console.error('Error processing referral bonuses:', error)
      return false
    }
  }

  /**
   * Activate referral when referee subscribes to paid plan
   * This is typically called from a webhook or subscription update function
   */
  static async activateReferral(refereeUserId: string): Promise<boolean> {
    try {
      // The database trigger will handle the activation automatically
      // when user_plans table is updated with active subscription
      // This function is here for manual activation if needed
      
      const { error } = await supabase
        .from('referrals')
        .update({
          is_active: true,
          activation_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('referee_id', refereeUserId)

      return !error
    } catch (error) {
      console.error('Error activating referral:', error)
      return false
    }
  }

  /**
   * Deactivate referral when referee cancels subscription
   */
  static async deactivateReferral(refereeUserId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('referrals')
        .update({
          is_active: false,
          deactivation_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('referee_id', refereeUserId)

      return !error
    } catch (error) {
      console.error('Error deactivating referral:', error)
      return false
    }
  }

  /**
   * Get referral statistics for display
   */
  static calculateReferralValue(activeDays: number): {
    monthsValue: number
    dollarsValue: number
    percentage: number
  } {
    const monthsValue = Math.floor(activeDays / 30)
    const dollarsValue = activeDays * 0.33 // Assuming $10/month, so ~$0.33/day
    const percentage = Math.min(100, (activeDays / 10) * 10) // 10 days = 10%
    
    return {
      monthsValue,
      dollarsValue: Math.round(dollarsValue * 100) / 100,
      percentage: Math.round(percentage)
    }
  }

  /**
   * Initialize referral stats with a specific referral code (for consistency with user_profiles)
   */
  static async initializeUserReferralStatsWithCode(userId: string, email: string, referralCode: string): Promise<boolean> {
    try {
      const code = (referralCode || this.generateReferralCode(email)).trim().toUpperCase()
      
      const { error } = await supabase
        .from('user_referral_stats')
        .upsert({
          user_id: userId,
          referral_code: code,
          total_referrals: 0,
          active_referrals: 0,
          bonus_days_earned: 0,
          bonus_days_used: 0
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('Error initializing referral stats with code:', error)
        return false
      }
      
      console.log(`✅ Initialized referral stats for user ${userId} with code: ${code}`)
      return true
    } catch (error) {
      console.error('Error in initializeUserReferralStatsWithCode:', error)
      return false
    }
  }

}