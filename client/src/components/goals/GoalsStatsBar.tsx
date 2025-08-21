import { memo } from 'react'
import { Target, TrendingUp, Clock, AlertCircle, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GoalsStatsBarProps {
  stats: {
    total: number
    completed: number
    inProgress: number
    notStarted: number
    atRisk: number
    completionRate: number
    avgProgress: number
  }
  onShowAnalytics: () => void
  showAnalytics: boolean
}

export const GoalsStatsBar = memo(function GoalsStatsBar({ 
  stats, 
  onShowAnalytics, 
  showAnalytics 
}: GoalsStatsBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Goals</CardTitle>
          <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
          <p className="text-xs text-blue-600 dark:text-blue-400">{stats.total} active</p>
        </CardContent>
      </Card>

      <Card className="bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Completion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{Math.round(stats.completionRate)}%</div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">{stats.completed}/{stats.total}</p>
        </CardContent>
      </Card>

      <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.inProgress}</div>
          <p className="text-xs text-orange-600 dark:text-orange-400">{Math.round(stats.avgProgress)}% avg</p>
        </CardContent>
      </Card>

      <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">At Risk</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.atRisk}</div>
          <p className="text-xs text-red-600 dark:text-red-400">{stats.atRisk > 0 ? "needs attention" : "on track"}</p>
        </CardContent>
      </Card>

      <div className="col-span-full flex justify-end">
        <Button
          variant={showAnalytics ? "default" : "outline"}
          size="sm"
          onClick={onShowAnalytics}
          className="gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        </Button>
      </div>
    </div>
  )
})