import React from 'react'
import { BaseStatsCard, CardZones } from './BaseStatsCard'
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

  // Create badge content for header
  const headerBadges = (
    <div className="flex items-center gap-1 flex-wrap justify-center">
      {stats.hasAnyMilestoneGoals && (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 text-xs">
          <CheckSquare className="h-3 w-3 mr-1" />
          {stats.milestoneGoalsCount} milestone
        </Badge>
      )}
    </div>
  )

  // Create insight content
  let insightContent = null
  let insightVariant: 'default' | 'warning' | 'success' | 'info' = 'default'

  if (stats.urgentCount > 0) {
    insightContent = `${stats.urgentCount} urgent deadlines approaching`
    insightVariant = 'warning'
  } else if (stats.hasAnyMilestoneGoals && stats.milestoneStats.pendingMilestones > 0) {
    insightContent = `${stats.milestoneStats.pendingMilestones} milestones pending completion`
    insightVariant = 'info'
  } else if (stats.milestoneStats.stalledGoals > 0) {
    insightContent = `${stats.milestoneStats.stalledGoals} goals need attention`
    insightVariant = 'warning'
  } else if (stats.upcomingGoal) {
    insightContent = `Next: ${stats.upcomingGoal.title.substring(0, 35)}${stats.upcomingGoal.title.length > 35 ? '...' : ''}`
    insightVariant = 'default'
  }

  const zones: CardZones = {
    header: {
      icon: <Target className="h-4 w-4" />,
      title: 'Goals',
      badge: headerBadges
    },
    metric: {
      primary: `${stats.averageProgress}%`,
      label: stats.hasAnyMilestoneGoals ? 'Weighted Progress' : 'Average Progress',
      status: progressInfo.status,
      statusColor: progressInfo.color,
      statusIcon: <progressInfo.icon className="h-3 w-3" />
    },
    progress: {
      value: stats.averageProgress,
      color: 'blue',
      subtitle: '100% complete',
      showPercentage: true
    },
    stats: {
      left: {
        value: stats.hasAnyMilestoneGoals ? stats.milestoneStats.completedMilestones : stats.activeCount,
        label: stats.hasAnyMilestoneGoals ? `of ${stats.milestoneStats.totalMilestones} milestones` : 'Active Goals'
      },
      right: {
        value: stats.hasAnyMilestoneGoals ? stats.activeCount : stats.highPriorityCount,
        label: stats.hasAnyMilestoneGoals ? 'Active Goals' : 'High Priority'
      }
    },
    insight: insightContent ? {
      icon: stats.urgentCount > 0 ? <AlertTriangle className="h-3 w-3" /> : 
            stats.milestoneStats.pendingMilestones > 0 ? <CheckSquare className="h-3 w-3" /> : 
            stats.milestoneStats.stalledGoals > 0 ? <Clock className="h-3 w-3" /> : 
            <Calendar className="h-3 w-3" />,
      text: insightContent,
      variant: insightVariant
    } : undefined,
    action: {
      text: actionText,
      icon: stats.milestoneStats.pendingMilestones > 0 ? 
            <CheckSquare className="h-4 w-4 mr-2" /> : 
            <Plus className="h-4 w-4 mr-2" />,
      onClick: () => onNavigate('/goals'),
      variant: 'primary'
    }
  }

  const theme = {
    primary: 'blue',
    gradient: 'from-blue-50 to-blue-100',
    darkGradient: 'dark:from-blue-950/20 dark:to-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    hover: 'hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-600'
  }

  return (
    <BaseStatsCard 
      zones={zones} 
      theme={theme} 
      onClick={() => onNavigate('/goals')}
    />
  )
}