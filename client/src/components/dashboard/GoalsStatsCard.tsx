import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Target, Plus, AlertTriangle, CheckSquare, BarChart3, Zap, Calendar, Clock } from 'lucide-react'
import { Goal } from '@/types/goals'
import { isBefore, isAfter, addDays, format, subDays } from 'date-fns'

interface GoalsStatsCardProps {
  goals: Goal[]
  onNavigate: (path: string) => void
}

interface MilestoneStats {
  totalMilestones: number
  completedMilestones: number
  recentCompletions: number
  pendingMilestones: number
  stalledGoals: number
}

export function GoalsStatsCard({ goals, onNavigate }: GoalsStatsCardProps) {
  // Enhanced goals statistics with milestone intelligence
  const calculateGoalsStats = () => {
    const activeGoals = goals.filter(goal => goal.status !== 'completed')
    const completedGoals = goals.filter(goal => goal.status === 'completed')
    
    // Separate milestone-based vs manual goals
    const milestoneGoals = activeGoals.filter(goal => 
      goal.progress_type === 'milestone' || 
      goal.description?.includes('[MILESTONE_BASED]')
    )
    const manualGoals = activeGoals.filter(goal => 
      goal.progress_type !== 'milestone' && 
      !goal.description?.includes('[MILESTONE_BASED]')
    )
    
    // Calculate weighted progress for different goal types
    let totalWeightedProgress = 0
    let totalGoalsForAverage = 0
    
    activeGoals.forEach(goal => {
      if (goal.progress_type === 'milestone' || goal.description?.includes('[MILESTONE_BASED]')) {
        // For milestone goals, use their calculated progress (already weighted)
        totalWeightedProgress += goal.progress
        totalGoalsForAverage += 1
      } else {
        // For manual goals, use regular progress
        totalWeightedProgress += goal.progress
        totalGoalsForAverage += 1
      }
    })
    
    const averageProgress = totalGoalsForAverage > 0 ? Math.round(totalWeightedProgress / totalGoalsForAverage) : 0
    
    // Calculate milestone-specific stats
    const milestoneStats: MilestoneStats = {
      totalMilestones: 0,
      completedMilestones: 0,
      recentCompletions: 0,
      pendingMilestones: 0,
      stalledGoals: 0
    }
    
    // For milestone goals, estimate milestone stats based on progress
    milestoneGoals.forEach(goal => {
      // Estimate milestones based on typical templates (5-6 milestones per goal)
      const estimatedTotalMilestones = 6
      const estimatedCompletedMilestones = Math.round((goal.progress / 100) * estimatedTotalMilestones)
      
      milestoneStats.totalMilestones += estimatedTotalMilestones
      milestoneStats.completedMilestones += estimatedCompletedMilestones
      milestoneStats.pendingMilestones += (estimatedTotalMilestones - estimatedCompletedMilestones)
      
      // Check for stalled goals (low progress and old deadline)
      if (goal.progress < 20 && isBefore(new Date(goal.deadline), addDays(new Date(), 14))) {
        milestoneStats.stalledGoals += 1
      }
    })
    
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
      upcomingGoal,
      milestoneGoalsCount: milestoneGoals.length,
      manualGoalsCount: manualGoals.length,
      milestoneStats,
      hasAnyMilestoneGoals: milestoneGoals.length > 0,
      hasMixedGoalTypes: milestoneGoals.length > 0 && manualGoals.length > 0
    }
  }
  
  const stats = calculateGoalsStats()
  
  // Enhanced progress status with milestone intelligence
  const getProgressStatus = (progress: number, urgentCount: number, milestoneStats: MilestoneStats, hasAnyMilestoneGoals: boolean) => {
    if (urgentCount > 0) return { status: 'Urgent Items', color: 'text-red-600', icon: AlertTriangle }
    if (milestoneStats.stalledGoals > 0) return { status: 'Stalled Milestones', color: 'text-amber-600', icon: Clock }
    if (progress >= 80) return { status: hasAnyMilestoneGoals ? 'Strong Momentum' : 'Excellent', color: 'text-green-600', icon: Zap }
    if (progress >= 60) return { status: hasAnyMilestoneGoals ? 'Good Progress' : 'Good', color: 'text-blue-600', icon: BarChart3 }
    if (progress >= 40) return { status: 'Moderate', color: 'text-orange-600', icon: Target }
    return { status: 'Needs Focus', color: 'text-gray-500', icon: AlertTriangle }
  }

  // Get smart action button text based on goal composition
  const getSmartActionText = (stats: any) => {
    if (stats.milestoneStats.pendingMilestones > 0) {
      return `Complete ${Math.min(stats.milestoneStats.pendingMilestones, 3)} Milestones`
    }
    if (stats.manualGoalsCount > 0 && stats.milestoneGoalsCount === 0) {
      return 'Set Up Milestone Plans'
    }
    if (stats.hasAnyMilestoneGoals) {
      return 'Review Milestone Progress'
    }
    return 'Review Goals'
  }
  
  const progressInfo = getProgressStatus(stats.averageProgress, stats.urgentCount, stats.milestoneStats, stats.hasAnyMilestoneGoals)
  const actionText = getSmartActionText(stats)
  
  return (
    <Card className="relative overflow-hidden group 
      hover:shadow-lg hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30
      hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer
      hover:border-blue-300 dark:hover:border-blue-600
      bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 
      border-blue-200 dark:border-blue-800 h-full flex flex-col"
      onClick={() => onNavigate('/goals')}
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 
        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 min-h-[50px] relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Target className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Goals</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Goal Type Indicators */}
          {stats.hasAnyMilestoneGoals && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 text-xs">
              <CheckSquare className="h-3 w-3 mr-1" />
              {stats.milestoneGoalsCount} milestone
            </Badge>
          )}
          
          {stats.urgentCount > 0 && (
            <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {stats.urgentCount} urgent
            </Badge>
          )}
          
          {stats.milestoneStats.stalledGoals > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {stats.milestoneStats.stalledGoals} stalled
            </Badge>
          )}
          
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            {stats.completedThisMonth} completed
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col h-full space-y-4">
        {/* Primary Metrics */}
        <div className="text-center space-y-1">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats.averageProgress}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {stats.hasAnyMilestoneGoals ? 'Weighted Progress' : 'Average Progress'}
          </div>
          <div className={`text-xs font-medium flex items-center justify-center gap-1 ${progressInfo.color}`}>
            <progressInfo.icon className="h-3 w-3" />
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
        
        {/* Enhanced Secondary Stats */}
        {stats.hasAnyMilestoneGoals ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {stats.milestoneStats.completedMilestones}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">
                of {stats.milestoneStats.totalMilestones} milestones
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.activeCount}</div>
              <div className="text-gray-600 dark:text-gray-400">Active Goals</div>
            </div>
          </div>
        ) : (
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
        )}
        
        {/* Smart Insights */}
        {stats.hasAnyMilestoneGoals && stats.milestoneStats.pendingMilestones > 0 && (
          <div className="text-xs text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="font-medium text-orange-700 dark:text-orange-300">
              {stats.milestoneStats.pendingMilestones} milestones pending
            </div>
            <div className="text-orange-600 dark:text-orange-400">
              Complete them to boost progress
            </div>
          </div>
        )}
        
        {/* Next Milestone */}
        {stats.upcomingGoal && !stats.hasAnyMilestoneGoals && (
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
            Next: {stats.upcomingGoal.title.substring(0, 30)}
            {stats.upcomingGoal.title.length > 30 ? '...' : ''} 
            <br />
            Due: {format(new Date(stats.upcomingGoal.deadline), 'MMM d')}
          </div>
        )}
        
        {/* Milestone-specific next item */}
        {stats.upcomingGoal && stats.hasAnyMilestoneGoals && (
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckSquare className="h-3 w-3" />
              Next Goal: {stats.upcomingGoal.title.substring(0, 25)}
              {stats.upcomingGoal.title.length > 25 ? '...' : ''}
            </div>
            <div className="flex items-center justify-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              Due: {format(new Date(stats.upcomingGoal.deadline), 'MMM d')}
            </div>
          </div>
        )}
        
        {/* Spacer to push button to bottom */}
        <div className="flex-1"></div>
        
        {/* Smart Action Button */}
        <Button 
          onClick={() => onNavigate('/goals')}
          className={`w-full text-white transition-all duration-200 ${
            stats.milestoneStats.pendingMilestones > 0 
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
          }`}
          size="sm"
        >
          {stats.milestoneStats.pendingMilestones > 0 ? (
            <CheckSquare className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {actionText}
        </Button>
        

      </CardContent>
    </Card>
  )
}