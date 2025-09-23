import { supabase } from '@/lib/supabase'
import type { UserPlan, UsageLimits, PlanLimits, UsageStatus, PlanType } from '@/types/plans'

export class PlansService {
  // Get user's current plan using server API to ensure correct database connection
  static async getUserPlan(userId: string): Promise<UserPlan | null> {
    try {
      console.log('🔄 Fetching plan via server API for user:', userId)
      
      // Get JWT token for server API authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        console.error('❌ No authentication token available')
        return null
      }

      // Use server API endpoint to get authoritative plan data
      const response = await fetch('/api/plans/user-plan-details', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('❌ Server API request failed:', response.status, response.statusText)
        return null
      }

      const planData = await response.json()
      console.log('📊 Server API plan result:', planData)

      // Convert server response to UserPlan format
      return {
        id: planData.id || 'unknown',
        user_id: userId,
        plan_type: planData.plan_type || 'free',
        payment_status: planData.payment_status || 'free',
        expires_at: planData.expires_at,
        created_at: planData.created_at || new Date().toISOString(),
        updated_at: planData.updated_at || new Date().toISOString(),
        is_trial: planData.plan_type === 'trial' || (planData.plan_type === 'free' && planData.expires_at && new Date(planData.expires_at) > new Date())
      } as UserPlan

    } catch (error) {
      console.error('❌ Error fetching user plan:', error)
      return null
    }
  }

  // Check if user is in trial period
  static async isUserInTrial(userId: string): Promise<boolean> {
    try {
      console.log('🔍 Checking trial status for user:', userId)
      
      // Get JWT token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return false

      // Use server API for trial check
      const response = await fetch('/api/plans/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) return false

      const statusData = await response.json()
      return statusData.is_trial || false

    } catch (error) {
      console.error('❌ Error checking trial status:', error)
      return false
    }
  }

  // Get current month usage limits
  static async getUserUsage(userId: string): Promise<UsageLimits | null> {
    const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM format
    
    try {
      // First try to get existing usage record
      let { data, error } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', currentMonth)
        .maybeSingle()

      if (error && error.code === 'PGRST116') {
        // No record exists, try to create one
        try {
          const { data: newUsage, error: createError } = await supabase
            .from('usage_limits')
            .insert([{ user_id: userId, month_year: currentMonth }])
            .select()
            .single()

          if (createError) {
            console.log('Error creating usage limits, using default:', createError.message)
            return this.createDefaultUsageLimits(userId, currentMonth)
          }

          data = newUsage
        } catch (insertError) {
          return this.createDefaultUsageLimits(userId, currentMonth)
        }
      } else if (error) {
        console.log('Error fetching user usage, using default:', error.message)
        return this.createDefaultUsageLimits(userId, currentMonth)
      }

      return data || this.createDefaultUsageLimits(userId, currentMonth)
    } catch (error) {
      return this.createDefaultUsageLimits(userId, currentMonth)
    }
  }

  // Create default usage limits when database is not available
  static createDefaultUsageLimits(userId: string, monthYear: string): UsageLimits {
    const now = new Date().toISOString()
    return {
      id: `default-${userId}-${monthYear}`,
      user_id: userId,
      month_year: monthYear,
      storage_used: 0,
      documents_uploaded: 0,
      journal_entries_created: 0,
      goals_created: 0,
      calculator_uses: {},
      created_at: now,
      updated_at: now
    }
  }

  // Get plan limits for a specific plan type
  static async getPlanLimits(planType: PlanType): Promise<PlanLimits | null> {
    // Return hardcoded limits since we're using a view that might not work with RPC
    if (planType === 'free') {
      return {
        plan_type: 'free',
        storage_limit: 50 * 1024 * 1024, // 50MB
        max_file_size: 10 * 1024 * 1024, // 10MB
        monthly_documents: 20,
        monthly_journal_entries: 10,
        max_active_goals: 5,
        daily_calculator_uses: 3
      }
    } else if (planType === 'trial') {
      // Trial users get premium-level limits but with time restriction
      return {
        plan_type: 'trial',
        storage_limit: 10 * 1024 * 1024 * 1024, // 10GB
        max_file_size: 100 * 1024 * 1024, // 100MB
        monthly_documents: 10000,
        monthly_journal_entries: 10000,
        max_active_goals: 1000,
        daily_calculator_uses: 1000
      }
    } else {
      return {
        plan_type: 'premium',
        storage_limit: 10 * 1024 * 1024 * 1024, // 10GB
        max_file_size: 100 * 1024 * 1024, // 100MB
        monthly_documents: 10000,
        monthly_journal_entries: 10000,
        max_active_goals: 1000,
        daily_calculator_uses: 1000
      }
    }
  }

  // Get real storage usage from Supabase Storage
  static async getStorageUsage(userId: string): Promise<{ used: number; fileCount: number }> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('file_size')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching storage usage:', error)
        return { used: 0, fileCount: 0 }
      }

      const totalSize = data.reduce((sum, doc) => sum + (doc.file_size || 0), 0)
      return { used: totalSize, fileCount: data.length }
    } catch (error) {
      console.error('Error calculating storage usage:', error)
      return { used: 0, fileCount: 0 }
    }
  }

  // Get real goals count
  static async getGoalsCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('goals')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .neq('status', 'completed')

      if (error) {
        console.error('Error fetching goals count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error counting goals:', error)
      return 0
    }
  }

  // Get real journal entries count for current month
  static async getJournalEntriesCount(userId: string): Promise<number> {
    try {
      // First try with date range filter for current month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
      
      let { count, error } = await supabase
        .from('journal_entries')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)

      if (error) {
        console.error('Error fetching journal entries count:', error)
        // Fallback to total count if date filtering fails
        const { count: totalCount, error: fallbackError } = await supabase
          .from('journal_entries')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)

        if (fallbackError) {
          console.error('Error with fallback journal count:', fallbackError)
          return 0
        }

        return totalCount || 0
      }

      return count || 0
    } catch (error) {
      console.error('Error counting journal entries:', error)
      return 0
    }
  }

  // Get comprehensive usage status
  static async getUserUsageStatus(userId: string): Promise<UsageStatus> {
    try {
      const [plan, usage, storageInfo, goalsCount, journalCount] = await Promise.all([
        this.getUserPlan(userId),
        this.getUserUsage(userId),
        this.getStorageUsage(userId),
        this.getGoalsCount(userId),
        this.getJournalEntriesCount(userId)
      ])

      const planType = plan?.plan_type || 'free'
      const limits = await this.getPlanLimits(planType)

      if (!limits || !usage) {
        // Return safe defaults if we can't get limits or usage
        return {
          plan_type: planType,
          storage: { used: storageInfo.used, limit: 50 * 1024 * 1024, percentage: 0 },
          documents: { used: storageInfo.fileCount, limit: 20, percentage: 0 },
          journal_entries: { used: journalCount, limit: 10, percentage: 0 },
          goals: { used: goalsCount, limit: 5, percentage: 0 }
        }
      }

      const today = new Date().toISOString().substring(0, 10)
      const calculatorUsagesToday = Object.keys(usage.calculator_uses || {})
        .filter(key => key.endsWith(`_${today}`))
        .reduce((sum, key) => sum + (usage.calculator_uses[key] || 0), 0)

      return {
        plan_type: planType,
        storage: {
          used: storageInfo.used,
          limit: limits.storage_limit,
          percentage: Math.min(100, (storageInfo.used / limits.storage_limit) * 100)
        },
        documents: {
          used: usage.documents_uploaded,
          limit: limits.monthly_documents,
          percentage: Math.min(100, (usage.documents_uploaded / limits.monthly_documents) * 100)
        },
        journal_entries: {
          used: usage.journal_entries_created,
          limit: limits.monthly_journal_entries,
          percentage: Math.min(100, (usage.journal_entries_created / limits.monthly_journal_entries) * 100)
        },
        goals: {
          used: goalsCount,
          limit: limits.max_active_goals,
          percentage: Math.min(100, (goalsCount / limits.max_active_goals) * 100)
        },
        calculator_uses: {
          used: calculatorUsagesToday,
          limit: limits.daily_calculator_uses,
          percentage: Math.min(100, (calculatorUsagesToday / limits.daily_calculator_uses) * 100)
        }
      }
    } catch (error) {
      console.error('Error getting usage status:', error)
      // Return safe defaults in case of error
      return {
        plan_type: 'free',
        storage: { used: 0, limit: 50 * 1024 * 1024, percentage: 0 },
        documents: { used: 0, limit: 20, percentage: 0 },
        journal_entries: { used: 0, limit: 10, percentage: 0 },
        goals: { used: 0, limit: 5, percentage: 0 }
      }
    }
  }

  // Increment usage for a specific type
  static async incrementUsage(userId: string, type: 'documents' | 'journal' | 'goals' | 'calculator', details?: any): Promise<boolean> {
    try {
      const currentUsage = await this.getUserUsage(userId)
      if (!currentUsage) return false

      const currentMonth = new Date().toISOString().substring(0, 7)

      let updateData: any = {
        updated_at: new Date().toISOString()
      }

      switch (type) {
        case 'documents':
          updateData.documents_uploaded = currentUsage.documents_uploaded + 1
          if (details?.storageBytes) {
            updateData.storage_used = currentUsage.storage_used + details.storageBytes
          }
          break
        
        case 'journal':
          updateData.journal_entries_created = currentUsage.journal_entries_created + 1
          break
        
        case 'goals':
          updateData.goals_created = currentUsage.goals_created + 1
          break
        
        case 'calculator':
          if (details?.calculatorId) {
            const today = new Date().toISOString().substring(0, 10)
            const key = `${details.calculatorId}_${today}`
            const newCalculatorUses = { ...currentUsage.calculator_uses }
            newCalculatorUses[key] = (newCalculatorUses[key] || 0) + 1
            updateData.calculator_uses = newCalculatorUses
          }
          break
      }

      const { error } = await supabase
        .from('usage_limits')
        .update(updateData)
        .eq('user_id', userId)
        .eq('month_year', currentMonth)

      if (error) {
        console.error('Error updating usage:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error incrementing usage:', error)
      return false
    }
  }

  // Upgrade user to premium
  static async upgradeToPremium(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_plans')
        .update({
          plan_type: 'premium',
          updated_at: new Date().toISOString(),
          expires_at: null // For now, premium is indefinite
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error upgrading to premium:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error upgrading to premium:', error)
      return false
    }
  }

  // Format storage size for display
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}