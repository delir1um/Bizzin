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
          percentage: usageStatus.storage_percentage,
          label: 'Storage',
          unit: 'bytes'
        }
      case 'documents':
        return {
          current: current_usage.documents_uploaded,
          limit: plan_limits.monthly_documents,
          percentage: usageStatus.documents_percentage,
          label: 'Monthly Documents',
          unit: 'documents'
        }
      case 'journal':
        return {
          current: current_usage.journal_entries_created,
          limit: plan_limits.monthly_journal_entries,
          percentage: usageStatus.journal_percentage,
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

  if (limitInfo.percentage < 70) {
    return null // Don't show banner until user is approaching limits
  }

  return (
    <Alert className={`border-l-4 ${
      isAtLimit 
        ? 'border-red-500 bg-red-50 dark:bg-red-950/30' 
        : isNearLimit 
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
          : 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
    }`}>
      <div className="flex items-center gap-3">
        {isAtLimit ? (
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        ) : (
          <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        )}
        
        <div className="flex-1 space-y-2">
          <AlertDescription className="font-medium">
            {isAtLimit 
              ? `${limitInfo.label} limit reached!`
              : `Approaching ${limitInfo.label.toLowerCase()} limit`
            }
          </AlertDescription>
          
          <div className="flex items-center gap-3">
            <Progress 
              value={Math.min(limitInfo.percentage, 100)} 
              className="flex-1 h-2"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300 min-w-0">
              {formatValue(limitInfo.current, limitInfo.unit)} / {formatValue(limitInfo.limit, limitInfo.unit)}
            </span>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {isAtLimit 
              ? `Upgrade to Premium for unlimited ${limitInfo.label.toLowerCase()}`
              : `Upgrade to Premium before reaching your limit`
            }
          </p>
        </div>

        {onUpgrade && (
          <Button 
            onClick={onUpgrade}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade
          </Button>
        )}
      </div>
    </Alert>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}