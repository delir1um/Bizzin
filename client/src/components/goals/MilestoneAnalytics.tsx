import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Goal, Milestone } from "@/types/goals"
import { BarChart, TrendingUp, Target, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { format, differenceInDays, isAfter } from "date-fns"

interface MilestoneAnalyticsProps {
  goals: Goal[]
}

export function MilestoneAnalytics({ goals }: MilestoneAnalyticsProps) {
  // Filter goals that use milestone-based progress
  const milestoneGoals = goals.filter(goal => goal.progress_type === 'milestone')
  
  if (milestoneGoals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-orange-600" />
            Milestone Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No milestone-based goals yet</p>
            <p className="text-xs">Create goals with milestone tracking to see analytics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate analytics
  const totalMilestones = milestoneGoals.reduce((sum, goal) => sum + (goal.milestones?.length || 0), 0)
  const completedMilestones = milestoneGoals.reduce((sum, goal) => 
    sum + (goal.milestones?.filter(m => m.status === 'done').length || 0), 0
  )
  const inProgressMilestones = milestoneGoals.reduce((sum, goal) => 
    sum + (goal.milestones?.filter(m => m.status === 'in_progress').length || 0), 0
  )
  
  const completionRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
  
  // Identify goals at risk (overdue milestones or low progress)
  const goalsAtRisk = milestoneGoals.filter(goal => {
    if (!goal.milestones) return false
    
    const hasOverdueMilestones = goal.milestones.some(milestone => 
      milestone.due_date && 
      isAfter(new Date(), new Date(milestone.due_date)) && 
      milestone.status !== 'done'
    )
    
    const lowProgress = goal.progress < 25 && differenceInDays(new Date(goal.deadline), new Date()) < 30
    
    return hasOverdueMilestones || lowProgress
  })

  // Calculate average milestone weight
  const allMilestones = milestoneGoals.flatMap(goal => goal.milestones || [])
  const averageWeight = allMilestones.length > 0 
    ? allMilestones.reduce((sum, m) => sum + m.weight, 0) / allMilestones.length 
    : 1
  const isUsingWeights = allMilestones.some(m => m.weight > 1)

  // Top performing goals (highest progress with milestones)
  const topGoals = milestoneGoals
    .filter(goal => (goal.milestones?.length || 0) > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Milestones</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalMilestones}</p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedMilestones}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{inProgressMilestones}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{completionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Milestone Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Milestone Completion</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {completedMilestones} of {totalMilestones} completed
                </span>
              </div>
              <Progress value={completionRate} className="h-3" />
            </div>
            
            {isUsingWeights && (
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <Badge variant="outline">
                  Average Weight: {averageWeight.toFixed(1)}x
                </Badge>
                <span>Using weighted milestone calculation</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Goals at Risk */}
      {goalsAtRisk.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Goals Requiring Attention ({goalsAtRisk.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goalsAtRisk.map(goal => {
                const overdueMilestones = goal.milestones?.filter(m => 
                  m.due_date && 
                  isAfter(new Date(), new Date(m.due_date)) && 
                  m.status !== 'done'
                ).length || 0
                
                return (
                  <div key={goal.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{goal.title}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-red-600">Progress: {goal.progress}%</span>
                        {overdueMilestones > 0 && (
                          <span className="text-sm text-red-600">
                            {overdueMilestones} overdue milestone{overdueMilestones > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="destructive">At Risk</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Goals */}
      {topGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Top Performing Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topGoals.map((goal, index) => {
                const completedCount = goal.milestones?.filter(m => m.status === 'done').length || 0
                const totalCount = goal.milestones?.length || 0
                
                return (
                  <div key={goal.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{goal.title}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {completedCount}/{totalCount} milestones completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{goal.progress}%</p>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(goal.deadline), 'MMM d')}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}