import { supabase } from '@/lib/supabase'
import type { UserPlan, UsageLimits, PlanLimits, UsageStatus, PlanType } from '@/types/plans'

export class PlansService {
  // Get user's current plan
  static async getUserPlan(userId: string): Promise<UserPlan | null> {
    const { data, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user plan:', error)
      return null
    }

    return data
  }

  // Get current month usage limits
  static async getUserUsage(userId: string): Promise<UsageLimits | null> {
    const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM format
    
    const { data, error } = await supabase
      .rpc('get_or_create_usage_limits', {
        user_uuid: userId,
        current_month: currentMonth
      })

    if (error) {
      console.error('Error fetching user usage:', error)
      return null
    }

    return data
  }

  // Get plan limits for a specific plan type
  static async getPlanLimits(planType: PlanType): Promise<PlanLimits | null> {
    const { data, error } = await supabase
      .from('plan_limits')
      .select('*')
      .eq('plan_type', planType)
      .single()

    if (error) {
      console.error('Error fetching plan limits:', error)
      return null
    }

    return data
  }

  // Get comprehensive usage status for a user
  static async getUserUsageStatus(userId: string): Promise<UsageStatus | null> {
    try {
      const [userPlan, currentUsage] = await Promise.all([
        this.getUserPlan(userId),
        this.getUserUsage(userId)
      ])

      if (!userPlan || !currentUsage) {
        return null
      }

      const planLimits = await this.getPlanLimits(userPlan.plan_type)
      if (!planLimits) {
        return null
      }

      // Calculate percentages and availability
      const storage_percentage = (currentUsage.storage_used / planLimits.storage_limit) * 100
      const documents_percentage = (currentUsage.documents_uploaded / planLimits.monthly_documents) * 100
      const journal_percentage = (currentUsage.journal_entries_created / planLimits.monthly_journal_entries) * 100

      const can_upload_document = currentUsage.documents_uploaded < planLimits.monthly_documents
      const can_create_journal_entry = currentUsage.journal_entries_created < planLimits.monthly_journal_entries
      const can_create_goal = currentUsage.goals_created < planLimits.max_active_goals

      const can_use_calculator = (calculatorId: string): boolean => {
        const today = new Date().toISOString().substring(0, 10) // YYYY-MM-DD
        const todayUses = currentUsage.calculator_uses[`${calculatorId}_${today}`] || 0
        return todayUses < planLimits.daily_calculator_uses
      }

      return {
        current_usage: currentUsage,
        plan_limits: planLimits,
        user_plan: userPlan,
        can_upload_document,
        can_create_journal_entry,
        can_create_goal,
        can_use_calculator,
        storage_percentage: Math.min(storage_percentage, 100),
        documents_percentage: Math.min(documents_percentage, 100),
        journal_percentage: Math.min(journal_percentage, 100)
      }
    } catch (error) {
      console.error('Error getting usage status:', error)
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