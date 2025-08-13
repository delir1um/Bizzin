import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Crown, AlertTriangle, Zap } from "lucide-react"
import type { UsageStatus } from "@/types/plans"

interface PlanLimitBannerProps {
  usageStatus: UsageStatus
  limitType: 'storage' | 'documents' | 'journal' | 'goals' | 'calculator'
  onUpgrade?: () => void
}

export function PlanLimitBanner({ usageStatus, limitType, onUpgrade }: PlanLimitBannerProps) {
  const { current_usage, plan_limits, user_plan } = usageStatus
  
  if (user_plan.plan_type === 'premium') {
    return null // Premium users don't see limit banners
  }

  const getLimitInfo = () => {
    switch (limitType) {
      case 'storage':
        return {
          current: current_usage.storage_used,
          limit: plan_limits.storage_limit,
          percentage: (current_usage.storage_used / plan_limits.storage_limit) * 100,
          label: 'Storage',
          unit: 'bytes'
        }
      case 'documents':
        return {
          current: current_usage.documents_uploaded,
          limit: plan_limits.monthly_documents,
          percentage: (current_usage.documents_uploaded / plan_limits.monthly_documents) * 100,
          label: 'Monthly Documents',
          unit: 'documents'
        }
      case 'journal':
        return {
          current: current_usage.journal_entries_created,
          limit: plan_limits.monthly_journal_entries,
          percentage: (current_usage.journal_entries_created / plan_limits.monthly_journal_entries) * 100,
          label: 'Monthly Journal Entries',
          unit: 'entries'
        }
      case 'goals':
        return {
          current: current_usage.goals_created,
          limit: plan_limits.max_active_goals,
          percentage: (current_usage.goals_created / plan_limits.max_active_goals) * 100,
          label: 'Active Goals',
          unit: 'goals'
        }
      default:
        return null
    }
  }

  const limitInfo = getLimitInfo()
  if (!limitInfo) return null

  const formatValue = (value: number, unit: string) => {
    if (unit === 'bytes') {
      return formatBytes(value)
    }
    return value.toString()
  }

  const isNearLimit = limitInfo.percentage >= 80
  const isAtLimit = limitInfo.percentage >= 100

  // Don't show limit banners for unified plan - focus on positive messaging instead
  return null
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}