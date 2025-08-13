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
    enabled: !!user, // Re-enable now that table exists
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })

  const isPremium = usageStatus?.user_plan?.plan_type === 'premium'
  const isFree = usageStatus?.user_plan?.plan_type === 'free'

  // Helper functions for checking limits - default to false for security when usageStatus unavailable
  const canUploadDocument = usageStatus?.can_upload_document ?? false
  const canCreateJournalEntry = usageStatus?.can_create_journal_entry ?? false
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
    canUploadDocument,
    canCreateJournalEntry,
    canCreateGoal,
    canUseCalculator,
    hasStorageSpace,
    getRemainingQuota
  }
}