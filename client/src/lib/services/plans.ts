import { supabase } from '@/lib/supabase'
import type { UserPlan, UsageLimits, PlanLimits, UsageStatus, PlanType } from '@/types/plans'

export class PlansService {
  // Get user's current plan
  static async getUserPlan(userId: string): Promise<UserPlan | null> {
    try {
      const { data, error } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        // If table doesn't exist or there's a schema issue, return default free plan
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.log('user_plans table not available, using default free plan')
          return this.createDefaultFreePlan(userId)
        }
        
        // If no plan exists, create a free plan for the user
        if (error.code === 'PGRST116') {
          console.log('No plan found for user, creating free plan')
          try {
            const { data: newPlan, error: createError } = await supabase
              .from('user_plans')
              .insert([{ user_id: userId, plan_type: 'free' }])
              .select()
              .single()

            if (createError) {
              console.log('Error creating user plan, using default:', createError.message)
              return this.createDefaultFreePlan(userId)
            }

            return newPlan
          } catch (insertError) {
            console.log('Insert failed, using default free plan')
            return this.createDefaultFreePlan(userId)
          }
        }
        
        console.log('Plan query error, using default:', error.message)
        return this.createDefaultFreePlan(userId)
      }

      return data || this.createDefaultFreePlan(userId)
    } catch (error) {
      console.log('getUserPlan failed, using default free plan')
      return this.createDefaultFreePlan(userId)
    }
  }

  // Create a default free plan for users when database is not available
  static createDefaultFreePlan(userId: string): UserPlan {
    const now = new Date().toISOString()
    return {
      id: `default-${userId}`,
      user_id: userId,
      plan_type: 'free',
      plan_status: 'active',
      created_at: now,
      updated_at: now
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

      // If date filtering fails, get all entries as fallback
      if (error) {
        console.log('Monthly filter failed, getting all journal entries:', error)
        const result = await supabase
          .from('journal_entries')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
        
        count = result.count
        error = result.error
      }

      if (error) {
        console.error('Error fetching journal entries count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error counting journal entries:', error)
      return 0
    }
  }

  // Get comprehensive usage status for a user with real data
  static async getUserUsageStatus(userId: string): Promise<UsageStatus | null> {
    try {
      const [userPlan, storageUsage, goalsCount, journalCount] = await Promise.all([
        this.getUserPlan(userId),
        this.getStorageUsage(userId),
        this.getGoalsCount(userId),
        this.getJournalEntriesCount(userId)
      ])

      if (!userPlan) {
        return null
      }

      const planLimits = await this.getPlanLimits(userPlan.plan_type)
      if (!planLimits) {
        return null
      }

      // Create current usage with real data
      const currentUsage: UsageLimits = {
        id: 'real-usage',
        user_id: userId,
        month_year: new Date().toISOString().substring(0, 7),
        storage_used: storageUsage.used,
        documents_uploaded: storageUsage.fileCount,
        journal_entries_created: journalCount,
        goals_created: goalsCount,
        calculator_uses: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Create usage status object
      const usageStatus: UsageStatus = {
        user_plan: userPlan,
        current_usage: currentUsage,
        plan_limits: planLimits,
        can_upload_document: currentUsage.documents_uploaded < planLimits.monthly_documents,
        can_create_journal_entry: currentUsage.journal_entries_created < planLimits.monthly_journal_entries,
        can_create_goal: currentUsage.goals_created < planLimits.max_active_goals,
        can_use_calculator: (calculatorId: string) => {
          const dailyUses = currentUsage.calculator_uses?.[calculatorId] || 0
          return dailyUses < planLimits.daily_calculator_uses
        },
        // Add percentage calculations
        storage_percentage: Math.min(100, (currentUsage.storage_used / planLimits.storage_limit) * 100),
        documents_percentage: Math.min(100, (currentUsage.documents_uploaded / planLimits.monthly_documents) * 100),
        journal_percentage: Math.min(100, (currentUsage.journal_entries_created / planLimits.monthly_journal_entries) * 100)
      }

      return usageStatus
    } catch (error) {
      console.error('Error getting user usage status:', error)
      return null
    }
  }

  // Update usage when user performs an action
  static async incrementUsage(
    userId: string, 
    type: 'documents' | 'journal' | 'goals' | 'calculator',
    details?: { calculatorId?: string; storageBytes?: number }
  ): Promise<boolean> {
    try {
      const currentMonth = new Date().toISOString().substring(0, 7)
      const currentUsage = await this.getUserUsage(userId)
      
      if (!currentUsage) {
        return false
      }

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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
}