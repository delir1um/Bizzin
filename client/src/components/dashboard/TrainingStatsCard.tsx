import React from 'react'
import { BaseStatsCard, CardZones } from './BaseStatsCard'
import { Badge } from '@/components/ui/badge'
import { Brain, PlayCircle, BookOpen, GraduationCap, Target } from 'lucide-react'

interface TrainingStatsCardProps {
  onNavigate: (path: string) => void
}

export function TrainingStatsCard({ onNavigate }: TrainingStatsCardProps) {
  // Training modules data - This would typically come from a service
  // For now, using representative data based on the Training page structure
  const trainingStats = {
    modulesCompleted: 3, // Based on typical user progress
    totalModules: 12, // Total available modules
    learningStreak: 5, // Days with training activity
    timeInvestedHours: 8.5, // Hours spent this month
    nextRecommended: 'Business Model Canvas',
    completionRate: 25 // Percentage of modules completed
  }
  
  // Determine learning status and color
  const getLearningStatus = (streak: number, completionRate: number) => {
    if (completionRate >= 75) return { status: 'Advanced', color: 'text-green-600' }
    if (completionRate >= 50) return { status: 'Progressing', color: 'text-blue-600' }
    if (completionRate >= 25) return { status: 'Learning', color: 'text-orange-600' }
    if (streak > 0) return { status: 'Getting Started', color: 'text-purple-600' }
    return { status: 'Start Learning', color: 'text-gray-500' }
  }
  
  const learningInfo = getLearningStatus(trainingStats.learningStreak, trainingStats.completionRate)

  // Create header badge
  const headerBadge = (
    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs">
      {trainingStats.modulesCompleted}/{trainingStats.totalModules} modules
    </Badge>
  )

  const zones: CardZones = {
    header: {
      icon: <Brain className="h-4 w-4" />,
      title: 'Training',
      badge: headerBadge
    },
    metric: {
      primary: `${trainingStats.completionRate}%`,
      label: 'Completion Rate',
      status: learningInfo.status,
      statusColor: learningInfo.color,
      statusIcon: trainingStats.completionRate >= 75 ? <GraduationCap className="h-3 w-3" /> : 
                  trainingStats.completionRate >= 25 ? <Target className="h-3 w-3" /> : 
                  <BookOpen className="h-3 w-3" />
    },
    progress: {
      value: trainingStats.completionRate,
      color: 'purple',
      subtitle: '100% mastery',
      showPercentage: true
    },
    stats: {
      left: {
        value: trainingStats.learningStreak,
        label: 'Day Streak'
      },
      right: {
        value: `${trainingStats.timeInvestedHours}h`,
        label: 'This Month'
      }
    },
    insight: {
      icon: <BookOpen className="h-3 w-3" />,
      text: `Next: ${trainingStats.nextRecommended}`,
      variant: 'default'
    },
    action: {
      text: 'Continue Learning',
      icon: <PlayCircle className="h-4 w-4 mr-2" />,
      onClick: () => onNavigate('/training'),
      variant: 'primary'
    }
  }

  const theme = {
    primary: 'purple',
    gradient: 'from-purple-50 to-purple-100',
    darkGradient: 'dark:from-purple-950/20 dark:to-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    hover: 'hover:shadow-purple-200/50 dark:hover:shadow-purple-900/30',
    hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-600'
  }

  return (
    <BaseStatsCard 
      zones={zones} 
      theme={theme} 
      onClick={() => onNavigate('/training')}
    />
  )
}