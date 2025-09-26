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

export interface ReferralBonus {
  hasBonus: boolean
  expiresAt: string | null
  daysUntilExpiry: number | null
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
   * UNIFIED REFERRAL CODE GENERATION SYSTEM
   * Generates consistent, stable referral codes that never change for a given email
   * This matches the server-side generation logic exactly
   */
  static generateReferralCode(email: string): string {
    const cleanEmail = email.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Create a consistent hash using the same algorithm as server
    let hash = 0;
    for (let i = 0; i < cleanEmail.length; i++) {
      const char = cleanEmail.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive number and create deterministic code
    const positiveHash = Math.abs(hash);
    const codeBase = positiveHash.toString(36).toUpperCase();
    
    // Create exactly 10-character code by taking first 4 chars of email + 6 chars from hash
    const emailPrefix = cleanEmail.substring(0, 4).toUpperCase().padEnd(4, '0');
    const hashSuffix = codeBase.length >= 6 ? codeBase.substring(0, 6) : codeBase.padStart(6, '0');
    
    const finalCode = emailPrefix + hashSuffix;
    console.log(`🔧 Generated consistent referral code for ${email}: ${finalCode}`);
    return finalCode;
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
    try {
      // Use the new API endpoint that bypasses schema cache issues
      const response = await fetch(`/api/referrals/dashboard/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch referral dashboard')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching referral dashboard:', error)
      return null
    }
  }

  /**
   * Get list of user's referrals using new schema
   */
  static async getUserReferrals(userId: string): Promise<ReferralEntry[]> {
    try {
      // Use the new API endpoint that bypasses schema cache issues
      const response = await fetch(`/api/referrals/user/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user referrals')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching user referrals:', error)
      return []
    }
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
   * Uses server-side endpoint to bypass permission issues
   */
  static async validateReferralCode(referralCode: string): Promise<boolean> {
    if (!referralCode || referralCode.trim() === '') {
      return false
    }
    
    try {
      const response = await fetch(`/api/referrals/validate/${encodeURIComponent(referralCode.trim().toUpperCase())}`)
      const data = await response.json()
      return data.valid === true
    } catch (error) {
      console.error('Error validating referral code:', error)
      return false
    }
  }

  /**
   * Get referrer user ID from referral code
   * Returns null if code is invalid or referrer not found
   * Now uses server-side endpoint for consistency
   */
  static async getReferrerUserId(referralCode: string): Promise<string | null> {
    if (!referralCode || referralCode.trim() === '') {
      return null
    }

    try {
      const response = await fetch(`/api/referrals/validate/${encodeURIComponent(referralCode.trim().toUpperCase())}`)
      const data = await response.json()
      
      if (data.valid && data.referrer?.user_id) {
        return data.referrer.user_id
      }
      
      return null
    } catch (error) {
      console.error('Error getting referrer user ID:', error)
      return null
    }
  }

  /**
   * Legacy method: Get referrer user ID from referral code via direct database query
   * Keeping for backward compatibility but now deprecated due to permission issues
   */
  static async getReferrerUserIdLegacy(referralCode: string): Promise<string | null> {
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
   * Generate referral link for user
   */
  static generateReferralLink(referralCode: string): string {
    // Check if we have a custom deployment URL
    const deploymentUrl = import.meta.env.VITE_DEPLOYMENT_URL
    if (deploymentUrl) {
      return `${deploymentUrl}/?ref=${referralCode}`
    }
    
    // Auto-detect deployment URL based on current hostname
    const currentHostname = window.location.hostname
    let baseUrl = window.location.origin
    
    // Use current origin for referral links and go to home page
    // This works better for both logged-in and new users
    
    return `${baseUrl}/?ref=${referralCode}`
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
   * Check if user has a pending referral bonus
   */
  static async getUserReferralBonus(userId: string): Promise<ReferralBonus> {
    try {
      // Use the new API endpoint that bypasses schema cache issues
      const response = await fetch(`/api/referrals/bonus/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch referral bonus')
      }
      return await response.json()
    } catch (error) {
      console.error('Error checking referral bonus:', error)
      return { hasBonus: false, expiresAt: null, daysUntilExpiry: null }
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
