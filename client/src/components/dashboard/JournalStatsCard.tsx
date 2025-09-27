import React from 'react'
import { BaseStatsCard, CardZones } from './BaseStatsCard'
import { Badge } from '@/components/ui/badge'
import { Notebook, Plus, TrendingUp, Zap, Flame } from 'lucide-react'
import { JournalEntry } from '@/types/journal'
import { getMoodEmoji } from '@/lib/journalDisplayUtils'
import { isToday, isThisWeek, differenceInDays, format } from 'date-fns'

interface JournalStatsCardProps {
  journalEntries: JournalEntry[]
  onNavigate: (path: string) => void
}

export function JournalStatsCard({ journalEntries, onNavigate }: JournalStatsCardProps) {
  // Calculate journal statistics
  const calculateJournalStats = () => {
    const totalEntries = journalEntries.length
    
    // Calculate writing streak - count unique consecutive days, not individual entries
    let streak = 0
    if (journalEntries.length > 0) {
      // Get unique dates from all entries
      const uniqueDates = new Set(journalEntries.map(entry => 
        format(new Date(entry.entry_date || entry.created_at), 'yyyy-MM-dd')
      ))
      const sortedDates = Array.from(uniqueDates).sort().reverse()

      const today = new Date()
      const todayStr = format(today, 'yyyy-MM-dd')
      const yesterdayStr = format(new Date(today.getTime() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
      
      // Start counting if there's an entry today or yesterday (allow one day gap)
      if (sortedDates.includes(todayStr)) {
        streak = 1
        // Count backwards from today
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i-1])
          const currDate = new Date(sortedDates[i])
          if (differenceInDays(prevDate, currDate) === 1) {
            streak++
          } else {
            break
          }
        }
      } else if (sortedDates.includes(yesterdayStr)) {
        streak = 1
        // Find yesterday's position and count backwards
        const yesterdayIndex = sortedDates.indexOf(yesterdayStr)
        for (let i = yesterdayIndex + 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i-1])
          const currDate = new Date(sortedDates[i])
          if (differenceInDays(prevDate, currDate) === 1) {
            streak++
          } else {
            break
          }
        }
      }
    }
    
    // This week's entries
    const thisWeekEntries = journalEntries.filter(entry => 
      isThisWeek(new Date(entry.entry_date || entry.created_at))
    )
    
    // AI analysis rate
    const aiAnalyzedEntries = journalEntries.filter(entry => entry.sentiment_data)
    const aiAnalysisRate = totalEntries > 0 ? Math.round((aiAnalyzedEntries.length / totalEntries) * 100) : 0
    
    // Most common mood this week
    const weeklyMoods = thisWeekEntries
      .map(entry => entry.sentiment_data?.primary_mood || entry.mood)
      .filter(Boolean)
    
    const moodCounts = weeklyMoods.reduce((acc: Record<string, number>, mood) => {
      acc[mood!] = (acc[mood!] || 0) + 1
      return acc
    }, {})
    
    const dominantMood = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Neutral'
    
    return {
      totalEntries,
      streak,
      thisWeekCount: thisWeekEntries.length,
      aiAnalysisRate,
      dominantMood
    }
  }
  
  const stats = calculateJournalStats()
  
  // Determine streak status and color
  const getStreakStatus = (streak: number) => {
    if (streak >= 7) return { status: 'Excellent', color: 'text-green-600' }
    if (streak >= 3) return { status: 'Good', color: 'text-blue-600' }  
    if (streak >= 1) return { status: 'Active', color: 'text-orange-600' }
    return { status: 'Start Today', color: 'text-gray-500' }
  }
  
  const streakInfo = getStreakStatus(stats.streak)

  // Create header badge
  const headerBadge = (
    <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 text-xs">
      {stats.thisWeekCount} this week
    </Badge>
  )

  // Create insight content
  const insightText = stats.dominantMood && stats.dominantMood !== 'Neutral' ? 
    `Weekly mood: ${getMoodEmoji(stats.dominantMood)} ${stats.dominantMood}` :
    'Keep building your writing habit'

  const zones: CardZones = {
    header: {
      icon: <Notebook className="h-4 w-4" />,
      title: 'Journal',
      badge: headerBadge
    },
    metric: {
      primary: stats.streak,
      label: 'Day Writing Streak',
      status: streakInfo.status,
      statusColor: streakInfo.color,
      statusIcon: stats.streak >= 7 ? <Flame className="h-3 w-3" /> : 
                  stats.streak >= 3 ? <Zap className="h-3 w-3" /> : 
                  <TrendingUp className="h-3 w-3" />
    },
    progress: {
      value: Math.min(100, (stats.streak / 30) * 100), // 30-day goal
      color: 'orange',
      subtitle: '30 day goal',
      showPercentage: false
    },
    stats: {
      left: {
        value: stats.totalEntries,
        label: 'Total Entries'
      },
      right: {
        value: `${stats.aiAnalysisRate}%`,
        label: 'AI Enhanced'
      }
    },
    insight: {
      icon: <TrendingUp className="h-3 w-3" />,
      text: insightText,
      variant: 'default'
    },
    action: {
      text: 'Add Entry',
      icon: <Plus className="h-4 w-4 mr-2" />,
      onClick: () => onNavigate('/journal'),
      variant: 'primary'
    }
  }

  const theme = {
    primary: 'orange',
    gradient: 'from-orange-50 to-orange-100',
    darkGradient: 'dark:from-orange-950/20 dark:to-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    hover: 'hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30',
    hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-600'
  }

  return (
    <BaseStatsCard 
      zones={zones} 
      theme={theme} 
      onClick={() => onNavigate('/journal')}
    />
  )
}