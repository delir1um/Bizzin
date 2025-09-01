import React from 'react'
import { BaseStatsCard, CardZones } from './BaseStatsCard'
import { Badge } from '@/components/ui/badge'
import { Brain, PlayCircle, BookOpen, GraduationCap, Target } from 'lucide-react'
import { usePodcastDashboard, usePodcastEpisodes } from '@/hooks/usePodcastProgress'

interface TrainingStatsCardProps {
  onNavigate: (path: string) => void
}

export function TrainingStatsCard({ onNavigate }: TrainingStatsCardProps) {
  const { stats, metrics, isLoading } = usePodcastDashboard()
  const { data: allEpisodes } = usePodcastEpisodes()
  
  // Calculate actual training stats from real data
  const trainingStats = {
    modulesCompleted: metrics?.completedCount || 0,
    totalModules: allEpisodes?.length || 0,
    learningStreak: stats?.learning_streak || 0,
    timeInvestedHours: stats?.total_listening_time ? Math.round((stats.total_listening_time / 3600) * 10) / 10 : 0,
    nextRecommended: 'Business Model Canvas', // This could be dynamic based on completed episodes
    completionRate: metrics?.completionRate || 0
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

  // Create header badge with loading state
  const headerBadge = (
    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs">
      {isLoading ? "Loading..." : `${trainingStats.modulesCompleted}/${trainingStats.totalModules} modules`}
    </Badge>
  )

  const zones: CardZones = {
    header: {
      icon: <Brain className="h-4 w-4" />,
      title: 'Training',
      badge: headerBadge
    },
    metric: {
      primary: isLoading ? "--" : `${trainingStats.completionRate}%`,
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
        value: isLoading ? "--" : trainingStats.learningStreak,
        label: 'Day Streak'
      },
      right: {
        value: isLoading ? "--" : `${trainingStats.timeInvestedHours}h`,
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