import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PaystackUpgrade } from "@/components/plans/PaystackUpgrade"
import { PaystackService } from "@/lib/services/paystack"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { usePlans } from "@/hooks/usePlans"
import { useAuth } from "@/hooks/AuthProvider"
import { 
  Crown, 
  Database, 
  FileText, 
  BookOpen, 
  Target, 
  Calculator,
  Check,
  X
} from "lucide-react"

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatPercentage = (used: number, limit: number): number => {
  if (limit === 0) return 0
  return Math.round((used / limit) * 100)
}

const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return "bg-red-500"
  if (percentage >= 80) return "bg-orange-500" 
  if (percentage >= 60) return "bg-yellow-500"
  return "bg-green-500"
}

export function PlanManagement() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { user } = useAuth()
  const { usageStatus, isPremium, isFree, isLoading, refetch } = usePlans()
  
  // Get ZAR pricing for display
  const monthlyPrice = PaystackService.getSubscriptionPrice('monthly')
  const formattedMonthlyPrice = PaystackService.formatAmount(monthlyPrice)



  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
      </div>
    )
  }

  const planLimits = usageStatus?.plan_limits
  const currentUsage = usageStatus?.current_usage

  const features = [
    {
      name: "Storage Space",
      free: "50 MB",
      premium: "10 GB",
      icon: Database
    },
    {
      name: "Document Uploads",
      free: "20 per month",
      premium: "Unlimited",
      icon: FileText
    },
    {
      name: "Journal Entries",
      free: "10 per month", 
      premium: "Unlimited",
      icon: BookOpen
    },
    {
      name: "Active Goals",
      free: "5 goals",
      premium: "Unlimited",
      icon: Target
    },
    {
      name: "BizBuilder Calculations",
      free: "3 per day per tool",
      premium: "Unlimited",
      icon: Calculator
    }
  ]

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-slate-900 dark:text-white">
                  Current Plan: {isPremium ? 'Premium' : 'Free'}
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {isPremium 
                    ? 'You have access to all premium features'
                    : 'Upgrade to unlock unlimited access'
                  }
                </p>
              </div>
            </div>
            <Badge 
              variant={isPremium ? "default" : "secondary"}
              className={isPremium 
                ? "bg-orange-500 hover:bg-orange-600 text-white" 
                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }
            >
              {isPremium ? 'Premium' : 'Free'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!isPremium && (
            <Button 
              onClick={() => setShowUpgradeModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Upgrade to Premium - {formattedMonthlyPrice}/month
            </Button>
          )}
          {isPremium && (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Your premium subscription is active. Enjoy unlimited access to all features!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Overview */}
      {planLimits && currentUsage && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your current usage this month
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Storage Usage */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-700 dark:text-slate-300">Storage Used</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {formatBytes(currentUsage.storage_used)} / {formatBytes(planLimits.storage_limit)} 
                  ({formatPercentage(currentUsage.storage_used, planLimits.storage_limit)}%)
                </span>
              </div>
              <Progress 
                value={formatPercentage(currentUsage.storage_used, planLimits.storage_limit)}
                className="h-3 bg-slate-200 dark:bg-slate-700"
              />
            </div>

            {/* Documents */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-700 dark:text-slate-300">Documents Uploaded</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {currentUsage.documents_uploaded} / {planLimits.monthly_documents === 10000 ? '∞' : planLimits.monthly_documents}
                  {planLimits.monthly_documents !== 10000 && ` (${formatPercentage(currentUsage.documents_uploaded, planLimits.monthly_documents)}%)`}
                </span>
              </div>
              <Progress 
                value={planLimits.monthly_documents === 10000 ? 0 : formatPercentage(currentUsage.documents_uploaded, planLimits.monthly_documents)}
                className="h-3 bg-slate-200 dark:bg-slate-700"
              />
            </div>

            {/* Journal Entries */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-700 dark:text-slate-300">Journal Entries</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {currentUsage.journal_entries_created} / {planLimits.monthly_journal_entries === 10000 ? '∞' : planLimits.monthly_journal_entries}
                  {planLimits.monthly_journal_entries !== 10000 && ` (${formatPercentage(currentUsage.journal_entries_created, planLimits.monthly_journal_entries)}%)`}
                </span>
              </div>
              <Progress 
                value={planLimits.monthly_journal_entries === 10000 ? 0 : formatPercentage(currentUsage.journal_entries_created, planLimits.monthly_journal_entries)}
                className="h-3 bg-slate-200 dark:bg-slate-700"
              />
            </div>

            {/* Active Goals */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-700 dark:text-slate-300">Active Goals</span>
                <span className={`text-sm ${currentUsage.goals_created > planLimits.max_active_goals ? 'text-red-600 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                  {currentUsage.goals_created} / {planLimits.max_active_goals === 1000 ? '∞' : planLimits.max_active_goals}
                  {planLimits.max_active_goals !== 1000 && ` (${formatPercentage(currentUsage.goals_created, planLimits.max_active_goals)}%)`}
                </span>
              </div>
              <Progress 
                value={planLimits.max_active_goals === 1000 ? 0 : formatPercentage(currentUsage.goals_created, planLimits.max_active_goals)}
                className="h-3 bg-slate-200 dark:bg-slate-700"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Compare what's included in each plan
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.name} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {feature.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Free</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        {feature.free}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Premium</div>
                      <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        {feature.premium}
                      </div>
                    </div>
                    <div className="w-8 flex justify-center">
                      {isPremium ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {!isPremium && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button 
                onClick={() => setShowUpgradeModal(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                Upgrade to Premium - {formattedMonthlyPrice}/month
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              Upgrade Your Business Journey
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <PaystackUpgrade />
          </div>
          
          <div className="text-center pt-4 border-t">
            <Button variant="ghost" onClick={() => setShowUpgradeModal(false)} className="text-slate-600 hover:text-slate-900">
              I'll upgrade later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}