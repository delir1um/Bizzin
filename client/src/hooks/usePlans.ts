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

  const isPremium = usageStatus?.user_plan?.plan_type === 'premium' && 
                    usageStatus?.user_plan?.payment_status === 'active'
  const isFree = usageStatus?.user_plan?.plan_type === 'free'
  
  // CRITICAL: Only active trials count - expired trials should not get trial benefits
  const isTrial = usageStatus?.user_plan?.plan_type === 'trial' || 
                  (usageStatus?.user_plan?.plan_type === 'free' && 
                   usageStatus?.user_plan?.expires_at && 
                   new Date(usageStatus?.user_plan?.expires_at) > new Date())

  // NEW: Grace period logic - premium users with payment issues get 7-day grace period
  const isInGracePeriod = usageStatus?.user_plan?.payment_status === 'grace_period' &&
                          usageStatus?.user_plan?.grace_period_end &&
                          new Date(usageStatus?.user_plan?.grace_period_end) > new Date()

  // Check if grace period has expired but status hasn't been updated yet
  const isGracePeriodExpired = usageStatus?.user_plan?.payment_status === 'grace_period' &&
                               usageStatus?.user_plan?.grace_period_end &&
                               new Date(usageStatus?.user_plan?.grace_period_end) <= new Date()

  // Check if account is suspended due to payment failure
  const isSuspended = usageStatus?.user_plan?.payment_status === 'suspended' ||
                      usageStatus?.user_plan?.payment_status === 'failed' ||
                      isGracePeriodExpired

  // NEW: Detect expired trials - when usageStatus exists but user_plan is null
  // This means they had a trial that expired and now have no active plan
  const isExpiredTrial = usageStatus && !usageStatus.user_plan
  
  // Users get premium features if: premium + active, trial, or in grace period
  const hasPremiumFeatures = isPremium || isTrial || isInGracePeriod

  // Calculate grace period days remaining
  const gracePeriodDaysRemaining = usageStatus?.user_plan?.grace_period_end 
    ? Math.max(0, Math.ceil((new Date(usageStatus.user_plan.grace_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  // Helper functions for checking limits - temporarily allow all for journal entries
  const canUploadDocument = usageStatus?.can_upload_document ?? false
  const canCreateJournalEntry = true // Temporarily allow all journal entries 
  const canCreateGoal = usageStatus?.can_create_goal ?? false
  
  const canUseCalculator = (calculatorId: string): boolean => {
    return usageStatus?.can_use_calculator(calculatorId) ?? false
  }

  const hasStorageSpace = (fileSizeBytes: number): boolean => {
    if (!usageStatus) return false
    const remaining = usageStatus.plan_limits.storage_limit - usageStatus.current_usage.storage_used
    return remaining >= fileSizeBytes
  }

  const getRemainingQuota = (type: 'storage' | 'documents' | 'journal' | 'goals') => {
    if (!usageStatus) return 0
    
    switch (type) {
      case 'storage':
        return usageStatus.plan_limits.storage_limit - usageStatus.current_usage.storage_used
      case 'documents':
        return usageStatus.plan_limits.monthly_documents - usageStatus.current_usage.documents_uploaded
      case 'journal':
        return usageStatus.plan_limits.monthly_journal_entries - usageStatus.current_usage.journal_entries_created
      case 'goals':
        return usageStatus.plan_limits.max_active_goals - usageStatus.current_usage.goals_created
      default:
        return 0
    }
  }

  return {
    usageStatus,
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