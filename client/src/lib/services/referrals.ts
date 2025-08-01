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
   * Get list of user's referrals
   */
  static async getUserReferrals(userId: string): Promise<ReferralEntry[]> {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        id,
        referee_id,
        is_active,
        signup_date,
        activation_date,
        deactivation_date
      `)
      .eq('referrer_id', userId)
      .order('signup_date', { ascending: false })

    if (error) {
      console.error('Error fetching user referrals:', error)
      return []
    }

    // Return referrals with placeholder emails (will be populated when foreign keys are properly set up)
    return data.map(referral => ({
      id: referral.id,
      referee_email: `User ${referral.referee_id.substring(0, 8)}...`,
      is_active: referral.is_active,
      signup_date: referral.signup_date,
      activation_date: referral.activation_date,
      deactivation_date: referral.deactivation_date
    }))
  }

  /**
   * Process a new user signup with referral code
   */
  static async processReferralSignup(referralCode: string, newUserId: string): Promise<boolean> {
    try {
      // Find the referrer by referral code
      const { data: referrerData, error: referrerError } = await supabase
        .from('user_referral_stats')
        .select('user_id')
        .eq('referral_code', referralCode)
        .single()

      if (referrerError || !referrerData) {
        console.error('Invalid referral code:', referralCode)
        return false
      }

      // Create referral record
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerData.user_id,
          referee_id: newUserId,
          referral_code: referralCode,
          is_active: false // Will be activated when user subscribes
        })

      if (referralError) {
        console.error('Error creating referral record:', referralError)
        return false
      }

      // Update referrer's total referrals count
      const { data: currentStats } = await supabase
        .from('user_referral_stats')
        .select('total_referrals')
        .eq('user_id', referrerData.user_id)
        .single()

      const { error: updateError } = await supabase
        .from('user_referral_stats')
        .update({ 
          total_referrals: (currentStats?.total_referrals || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', referrerData.user_id)

      if (updateError) {
        console.error('Error updating referrer stats:', updateError)
      }

      return true
    } catch (error) {
      console.error('Error processing referral signup:', error)
      return false
    }
  }

  /**
   * Validate a referral code
   */
  static async validateReferralCode(referralCode: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_referral_stats')
      .select('referral_code')
      .eq('referral_code', referralCode)
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
    
    // Handle Replit development URLs - convert to deployment URL
    if (currentHostname.includes('.repl.co') || currentHostname.includes('.replit.dev')) {
      // Extract REPL ID from various Replit URL formats
      // Format: b4a595c1-5278-4619-92c1-c13562ecc1a6-00-28rr7dv01069q.worf.repl.co
      const replIdMatch = currentHostname.match(/^([a-f0-9-]+)-\d+-[a-z0-9]+\./)
      if (replIdMatch) {
        baseUrl = `https://${replIdMatch[1]}.replit.app`
      } else {
        // Fallback: try to extract any UUID-like pattern
        const uuidMatch = currentHostname.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/)
        if (uuidMatch) {
          baseUrl = `https://${uuidMatch[1]}.replit.app`
        }
      }
    }
    // If we're on localhost, keep as-is for development
    // If we're already on .replit.app, keep as-is
    
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
}