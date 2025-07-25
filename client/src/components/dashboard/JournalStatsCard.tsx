import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Notebook, Plus, TrendingUp, Info } from 'lucide-react'
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
    
    // Calculate writing streak
    let streak = 0
    if (journalEntries.length > 0) {
      const sortedEntries = [...journalEntries].sort((a, b) => 
        new Date(b.entry_date || b.created_at).getTime() - new Date(a.entry_date || a.created_at).getTime()
      )
      
      let currentDate = new Date()
      let consecutiveDays = 0
      
      // Check if there's an entry today or yesterday (allow one day gap)
      const latestEntry = sortedEntries[0]
      const latestEntryDate = new Date(latestEntry.entry_date || latestEntry.created_at)
      const daysSinceLatest = differenceInDays(currentDate, latestEntryDate)
      
      if (daysSinceLatest <= 1) {
        // Start counting from the latest entry date
        currentDate = latestEntryDate
        consecutiveDays = 1
        
        // Count backwards to find consecutive days
        for (let i = 1; i < sortedEntries.length; i++) {
          const entryDate = new Date(sortedEntries[i].entry_date || sortedEntries[i].created_at)
          const expectedDate = new Date(currentDate)
          expectedDate.setDate(expectedDate.getDate() - 1)
          
          if (differenceInDays(expectedDate, entryDate) === 0) {
            consecutiveDays++
            currentDate = entryDate
          } else {
            break
          }
        }
      }
      
      streak = consecutiveDays
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
  
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 min-h-[50px]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Notebook className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Journal</h3>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
          {stats.thisWeekCount} this week
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Primary Metrics */}
        <div className="text-center space-y-1">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats.streak}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Day Writing Streak</div>
          <div className={`text-xs font-medium ${streakInfo.color}`}>
            {streakInfo.status}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-orange-200/50 dark:bg-orange-800/30 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-orange-400 to-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (stats.streak / 30) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0 days</span>
            <span>30 day goal</span>
          </div>
        </div>
        
        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.totalEntries}</div>
            <div className="text-gray-600 dark:text-gray-400">Total Entries</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-1">
              {getMoodEmoji(stats.dominantMood)} {stats.dominantMood}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Weekly Mood</div>
          </div>
        </div>
        
        {/* Action Button */}
        <Button 
          onClick={() => onNavigate('/journal')}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
        
        {/* Info Tooltip */}
        <div className="absolute bottom-3 left-3" title="Writing streak tracks consecutive days with journal entries. AI analysis shows automatic mood and category detection rate.">
          <Info className="h-4 w-4 text-gray-400 hover:text-orange-600 cursor-help transition-colors" />
        </div>
      </CardContent>
    </Card>
  )
}