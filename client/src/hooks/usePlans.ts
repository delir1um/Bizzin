import { useQuery } from "@tanstack/react-query"
import { PlansService } from "@/lib/services/plans"
import { useAuth } from "@/hooks/AuthProvider"
import type { UsageStatus } from "@/types/plans"

export function usePlans() {
  const { user } = useAuth()

  // Get user's usage status (includes plan, limits, and current usage)
  const {
    data: usageStatus,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['usage-status', user?.id],
    queryFn: () => user ? PlansService.getUserUsageStatus(user.id) : null,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  })

  // ADMIN OVERRIDE: Force anton@cloudfusion.co.za to be seen as premium
  const isAdminUser = user?.email === 'anton@cloudfusion.co.za'
  
  // Override plan data for admin user
  const finalUsageStatus = isAdminUser ? {
    ...usageStatus,
    plan_type: 'premium',
    user_plan: {
      id: 'admin-override',
      user_id: user.id,
      plan_type: 'premium',
      payment_status: 'active',
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_trial: false
    }
  } : usageStatus

  const isPremium = finalUsageStatus?.user_plan?.plan_type === 'premium' && 
                    finalUsageStatus?.user_plan?.payment_status === 'active'
  const isFree = finalUsageStatus?.user_plan?.plan_type === 'free'
  
  // CRITICAL: Only active trials count - expired trials should not get trial benefits
  const isTrial = finalUsageStatus?.user_plan?.plan_type === 'trial' || 
                  (finalUsageStatus?.user_plan?.plan_type === 'free' && 
                   finalUsageStatus?.user_plan?.expires_at && 
                   new Date(finalUsageStatus?.user_plan?.expires_at) > new Date())

  // NEW: Grace period logic - premium users with payment issues get 7-day grace period
  const isInGracePeriod = finalUsageStatus?.user_plan?.payment_status === 'grace_period' &&
                          finalUsageStatus?.user_plan?.grace_period_end &&
                          new Date(finalUsageStatus?.user_plan?.grace_period_end) > new Date()

  // Check if grace period has expired but status hasn't been updated yet
  const isGracePeriodExpired = finalUsageStatus?.user_plan?.payment_status === 'grace_period' &&
                               finalUsageStatus?.user_plan?.grace_period_end &&
                               new Date(finalUsageStatus?.user_plan?.grace_period_end) <= new Date()

  // Check if account is suspended due to payment failure
  const isSuspended = finalUsageStatus?.user_plan?.payment_status === 'suspended' ||
                      finalUsageStatus?.user_plan?.payment_status === 'failed' ||
                      isGracePeriodExpired

  // NEW: Detect expired trials - when finalUsageStatus exists but user_plan is null
  // This means they had a trial that expired and now have no active plan
  const isExpiredTrial = finalUsageStatus && !finalUsageStatus.user_plan
  
  // Users get premium features if: premium + active, trial, or in grace period
  const hasPremiumFeatures = isPremium || isTrial || isInGracePeriod

  // Calculate grace period days remaining
  const gracePeriodDaysRemaining = finalUsageStatus?.user_plan?.grace_period_end 
    ? Math.max(0, Math.ceil((new Date(finalUsageStatus.user_plan.grace_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  // Helper functions for checking limits - admin gets unlimited access
  const canUploadDocument = isAdminUser ? true : (finalUsageStatus?.can_upload_document ?? false)
  const canCreateJournalEntry = true // Allow all journal entries 
  const canCreateGoal = isAdminUser ? true : (finalUsageStatus?.can_create_goal ?? false)
  
  const canUseCalculator = (calculatorId: string): boolean => {
    if (isAdminUser) return true
    return finalUsageStatus?.can_use_calculator(calculatorId) ?? false
  }

  const hasStorageSpace = (fileSizeBytes: number): boolean => {
    if (isAdminUser) return true
    if (!finalUsageStatus) return false
    const remaining = finalUsageStatus.plan_limits.storage_limit - finalUsageStatus.current_usage.storage_used
    return remaining >= fileSizeBytes
  }

  const getRemainingQuota = (type: 'storage' | 'documents' | 'journal' | 'goals') => {
    if (isAdminUser) return 999999 // Unlimited for admin
    if (!finalUsageStatus) return 0
    
    switch (type) {
      case 'storage':
        return finalUsageStatus.plan_limits.storage_limit - finalUsageStatus.current_usage.storage_used
      case 'documents':
        return finalUsageStatus.plan_limits.monthly_documents - finalUsageStatus.current_usage.documents_uploaded
      case 'journal':
        return finalUsageStatus.plan_limits.monthly_journal_entries - finalUsageStatus.current_usage.journal_entries_created
      case 'goals':
        return finalUsageStatus.plan_limits.max_active_goals - finalUsageStatus.current_usage.goals_created
      default:
        return 0
    }
  }

  return {
    usageStatus: finalUsageStatus,
    isLoading,
    error,
    refetch,
    isPremium,
    isFree,
    isTrial,
    isExpiredTrial,
    hasPremiumFeatures,
    // Grace period state
    isInGracePeriod,
    isGracePeriodExpired,
    isSuspended,
    gracePeriodDaysRemaining,
    // Access control functions
    canUploadDocument,
    canCreateJournalEntry,
    canCreateGoal,
    canUseCalculator,
    hasStorageSpace,
    getRemainingQuota
  }
}