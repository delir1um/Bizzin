import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Target, Plus, AlertTriangle, Info } from 'lucide-react'
import { Goal } from '@/types/goals'
import { isBefore, isAfter, addDays, format } from 'date-fns'

interface GoalsStatsCardProps {
  goals: Goal[]
  onNavigate: (path: string) => void
}

export function GoalsStatsCard({ goals, onNavigate }: GoalsStatsCardProps) {
  // Calculate goals statistics
  const calculateGoalsStats = () => {
    const activeGoals = goals.filter(goal => goal.status !== 'completed')
    const completedGoals = goals.filter(goal => goal.status === 'completed')
    
    // Calculate overall completion percentage
    const totalProgress = activeGoals.reduce((sum, goal) => sum + goal.progress, 0)
    const averageProgress = activeGoals.length > 0 ? Math.round(totalProgress / activeGoals.length) : 0
    
    // Find urgent deadlines (within 7 days)
    const urgentGoals = activeGoals.filter(goal => {
      const deadline = new Date(goal.deadline)
      const weekFromNow = addDays(new Date(), 7)
      return isBefore(deadline, weekFromNow) && isAfter(deadline, new Date())
    })
    
    // Goals completed this month
    const thisMonth = new Date()
    const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
    const completedThisMonth = completedGoals.filter(goal => {
      if (!goal.updated_at) return false
      const updatedDate = new Date(goal.updated_at)
      return isAfter(updatedDate, monthStart)
    })
    
    // High priority active goals
    const highPriorityGoals = activeGoals.filter(goal => goal.priority === 'high')
    
    // Next milestone (closest deadline)
    const upcomingGoal = activeGoals
      .filter(goal => isAfter(new Date(goal.deadline), new Date()))
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0]
    
    return {
      activeCount: activeGoals.length,
      completedCount: completedGoals.length,
      averageProgress,
      urgentCount: urgentGoals.length,
      completedThisMonth: completedThisMonth.length,
      highPriorityCount: highPriorityGoals.length,
      upcomingGoal
    }
  }
  
  const stats = calculateGoalsStats()
  
  // Determine progress status and color
  const getProgressStatus = (progress: number, urgentCount: number) => {
    if (urgentCount > 0) return { status: 'Urgent Items', color: 'text-red-600' }
    if (progress >= 80) return { status: 'Excellent', color: 'text-green-600' }
    if (progress >= 60) return { status: 'Good', color: 'text-blue-600' }
    if (progress >= 40) return { status: 'Moderate', color: 'text-orange-600' }
    return { status: 'Needs Focus', color: 'text-gray-500' }
  }
  
  const progressInfo = getProgressStatus(stats.averageProgress, stats.urgentCount)
  
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 min-h-[50px]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Target className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Goals</h3>
        </div>
        <div className="flex items-center gap-2">
          {stats.urgentCount > 0 && (
            <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {stats.urgentCount} urgent
            </Badge>
          )}
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            {stats.completedThisMonth} completed
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Primary Metrics */}
        <div className="text-center space-y-1">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats.averageProgress}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Average Progress</div>
          <div className={`text-xs font-medium ${progressInfo.color}`}>
            {progressInfo.status}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-blue-200/50 dark:bg-blue-800/30 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.averageProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0%</span>
            <span>100% complete</span>
          </div>
        </div>
        
        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.activeCount}</div>
            <div className="text-gray-600 dark:text-gray-400">Active Goals</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.highPriorityCount}</div>
            <div className="text-gray-600 dark:text-gray-400">High Priority</div>
          </div>
        </div>
        
        {/* Next Milestone */}
        {stats.upcomingGoal && (
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
            Next: {stats.upcomingGoal.title.substring(0, 30)}
            {stats.upcomingGoal.title.length > 30 ? '...' : ''} 
            <br />
            Due: {format(new Date(stats.upcomingGoal.deadline), 'MMM d')}
          </div>
        )}
        
        {/* Action Button */}
        <Button 
          onClick={() => onNavigate('/goals')}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Review Goals
        </Button>
        

      </CardContent>
    </Card>
  )
}