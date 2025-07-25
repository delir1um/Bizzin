import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, Minus, Shield, Info } from 'lucide-react'
import { JournalEntry } from '@/types/journal'
import { differenceInDays, differenceInHours, isAfter, isBefore, parseISO } from 'date-fns'

interface RecoveryResilienceCardProps {
  journalEntries: JournalEntry[]
}

interface RecoveryPeriod {
  challengeEntry: JournalEntry
  recoveryEntry: JournalEntry | null
  recoveryTimeHours: number | null
}

export function RecoveryResilienceCard({ journalEntries }: RecoveryResilienceCardProps) {
  const calculateRecoveryResilience = () => {
    if (journalEntries.length < 2) {
      return {
        averageRecoveryTime: 0,
        trend: 'neutral' as const,
        trendValue: 0,
        recoveryPeriods: [],
        resilienceScore: 0,
        level: 'Unknown' as const
      }
    }

    // Sort entries by date
    const sortedEntries = [...journalEntries].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    // Identify challenge/setback entries and subsequent recovery
    const challengeMoods = ['stressed', 'frustrated', 'overwhelmed', 'sad', 'conflicted', 'uncertain', 'tired']
    const challengeCategories = ['challenge']
    const recoveryMoods = ['confident', 'optimistic', 'accomplished', 'excited', 'motivated', 'inspired', 'determined']
    const recoveryCategories = ['achievement', 'growth']

    const recoveryPeriods: RecoveryPeriod[] = []

    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i]
      const mood = (entry.sentiment_data?.primary_mood || entry.mood || '').toLowerCase()
      const category = (entry.sentiment_data?.business_category || entry.category || '').toLowerCase()
      const content = entry.content.toLowerCase()

      // Check if this is a challenge/setback entry
      const isChallengeEntry = 
        challengeMoods.includes(mood) ||
        challengeCategories.includes(category) ||
        content.includes('problem') ||
        content.includes('setback') ||
        content.includes('difficult') ||
        content.includes('struggle') ||
        content.includes('failed')

      if (isChallengeEntry) {
        // Look for recovery in subsequent entries (within 7 days)
        let recoveryEntry: JournalEntry | null = null
        let recoveryTimeHours: number | null = null

        for (let j = i + 1; j < sortedEntries.length; j++) {
          const laterEntry = sortedEntries[j]
          const laterMood = (laterEntry.sentiment_data?.primary_mood || laterEntry.mood || '').toLowerCase()
          const laterCategory = (laterEntry.sentiment_data?.business_category || laterEntry.category || '').toLowerCase()
          const laterContent = laterEntry.content.toLowerCase()

          const challengeDate = new Date(entry.created_at)
          const laterDate = new Date(laterEntry.created_at)
          const daysDiff = differenceInDays(laterDate, challengeDate)

          // Stop looking after 7 days
          if (daysDiff > 7) break

          // Check if this is a recovery entry
          const isRecoveryEntry =
            recoveryMoods.includes(laterMood) ||
            recoveryCategories.includes(laterCategory) ||
            laterContent.includes('solution') ||
            laterContent.includes('breakthrough') ||
            laterContent.includes('resolved') ||
            laterContent.includes('success') ||
            laterContent.includes('progress') ||
            laterContent.includes('better')

          if (isRecoveryEntry) {
            recoveryEntry = laterEntry
            recoveryTimeHours = differenceInHours(laterDate, challengeDate)
            break
          }
        }

        recoveryPeriods.push({
          challengeEntry: entry,
          recoveryEntry,
          recoveryTimeHours
        })
      }
    }

    // Calculate average recovery time (only for successful recoveries)
    const successfulRecoveries = recoveryPeriods.filter(p => p.recoveryTimeHours !== null)
    const averageRecoveryTime = successfulRecoveries.length > 0
      ? successfulRecoveries.reduce((sum, p) => sum + (p.recoveryTimeHours || 0), 0) / successfulRecoveries.length
      : 0

    // Calculate trend (comparing recent recoveries to earlier ones)
    const recentRecoveries = successfulRecoveries.slice(-3)
    const earlierRecoveries = successfulRecoveries.slice(-6, -3)
    
    const recentAvg = recentRecoveries.length > 0
      ? recentRecoveries.reduce((sum, p) => sum + (p.recoveryTimeHours || 0), 0) / recentRecoveries.length
      : averageRecoveryTime

    const earlierAvg = earlierRecoveries.length > 0
      ? earlierRecoveries.reduce((sum, p) => sum + (p.recoveryTimeHours || 0), 0) / earlierRecoveries.length
      : averageRecoveryTime

    const trendValue = earlierAvg > 0 ? Math.round(((earlierAvg - recentAvg) / earlierAvg) * 100) : 0
    const trend = trendValue > 15 ? 'up' : trendValue < -15 ? 'down' : 'neutral'

    // Calculate resilience score (0-100)
    let resilienceScore = 50 // baseline

    // Factor 1: Recovery success rate (40% weight)
    const recoveryRate = recoveryPeriods.length > 0 
      ? (successfulRecoveries.length / recoveryPeriods.length) * 100 
      : 50
    resilienceScore += (recoveryRate - 50) * 0.4

    // Factor 2: Speed of recovery (30% weight) - faster is better
    if (averageRecoveryTime > 0) {
      const speedScore = Math.max(0, 100 - (averageRecoveryTime / 24)) // 24 hours = 0 points, 0 hours = 100 points
      resilienceScore += (speedScore - 50) * 0.3
    }

    // Factor 3: Trend improvement (30% weight)
    resilienceScore += (trendValue * 0.3)

    resilienceScore = Math.max(0, Math.min(100, Math.round(resilienceScore)))

    // Determine level
    let level: 'High' | 'Good' | 'Moderate' | 'Low' | 'Unknown'
    if (resilienceScore >= 80) level = 'High'
    else if (resilienceScore >= 60) level = 'Good' 
    else if (resilienceScore >= 40) level = 'Moderate'
    else level = 'Low'

    return {
      averageRecoveryTime,
      trend,
      trendValue,
      recoveryPeriods: recoveryPeriods.slice(-5), // Show last 5 recovery periods
      resilienceScore,
      level
    }
  }

  const { 
    averageRecoveryTime, 
    trend, 
    trendValue, 
    recoveryPeriods, 
    resilienceScore,
    level 
  } = calculateRecoveryResilience()

  const formatRecoveryTime = (hours: number) => {
    if (hours < 24) return `${Math.round(hours)}h`
    if (hours < 168) return `${Math.round(hours / 24)}d`
    return `${Math.round(hours / 168)}w`
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-slate-500" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-slate-600'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-green-50 text-green-700 border-green-200'
      case 'Good': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'Moderate': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'Low': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow relative">
      <CardHeader className="pb-3 min-h-[72px] flex items-center">
        <CardTitle className="flex items-center justify-between text-lg w-full">
          <span className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            Recovery Resilience
          </span>
          <Badge variant="outline" className={getLevelColor(level)}>
            {level.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Metric Display */}
        <div className="text-center h-[80px] flex flex-col justify-center">
          <div className={`text-3xl font-bold mb-1 ${
            resilienceScore >= 75 ? 'text-green-600' :
            resilienceScore >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {resilienceScore}
          </div>
          <div className="text-sm text-slate-600">Resilience Score</div>
        </div>

        {/* Progress Bar with Zones */}
        <div className="space-y-2 mb-4">
          <div className="relative w-full bg-slate-200 rounded-full h-3">
            {/* Zone backgrounds */}
            <div className="absolute left-0 w-1/2 h-full bg-red-100 rounded-l-full"></div>
            <div className="absolute left-1/2 w-1/4 h-full bg-yellow-100"></div>
            <div className="absolute right-0 w-1/4 h-full bg-green-100 rounded-r-full"></div>
            {/* Progress indicator */}
            <div 
              className={`absolute top-0 h-full rounded-full transition-all duration-500 ${
                resilienceScore >= 75 ? 'bg-green-500' :
                resilienceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(resilienceScore, 100)}%` }}
            />
          </div>
          {/* Zone labels */}
          <div className="flex justify-between text-xs text-slate-500">
            <span>Fragile</span>
            <span>Stable</span>
            <span>Strong</span>
            <span>Robust</span>
          </div>
        </div>

        {/* Secondary Metrics Row */}
        <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-center">
            <div className="text-xl font-bold text-slate-900">
              {averageRecoveryTime > 0 ? formatRecoveryTime(averageRecoveryTime) : 'N/A'}
            </div>
            <div className="text-xs text-slate-600">Avg Recovery Time</div>
          </div>
          <div className="text-center">
            <div className={`flex items-center gap-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="font-semibold text-sm">
                {trend === 'neutral' ? 'Stable' : 
                 trend === 'up' ? `${trendValue}% Faster` : 
                 `${Math.abs(trendValue)}% Slower`}
              </span>
            </div>
            <div className="text-xs text-slate-600">Recovery Trend</div>
          </div>
        </div>



        {/* Recovery Periods */}
        {recoveryPeriods.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-700">Recent Recovery Patterns:</h4>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {recoveryPeriods.slice(-3).map((period, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                  <span className="text-slate-600 truncate flex-1">
                    {period.challengeEntry.title || 'Challenge Entry'}
                  </span>
                  <span className={`font-medium ml-2 ${
                    period.recoveryTimeHours 
                      ? period.recoveryTimeHours < 24 
                        ? 'text-green-600' 
                        : period.recoveryTimeHours < 72 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                      : 'text-slate-500'
                  }`}>
                    {period.recoveryTimeHours ? formatRecoveryTime(period.recoveryTimeHours) : 'Ongoing'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="p-3 bg-slate-50 rounded-lg">
          <h4 className="text-sm font-medium text-slate-700 mb-1">Resilience Insights:</h4>
          <div className="text-sm text-slate-600">
            {level === 'High' 
              ? "Excellent recovery ability! You bounce back quickly from setbacks and maintain momentum."
              : level === 'Good'
              ? "Good resilience. You recover well from challenges with consistent patterns."
              : level === 'Moderate'
              ? "Moderate resilience. Focus on developing coping strategies and support systems."
              : recoveryPeriods.length === 0
              ? "Insufficient data to assess recovery patterns. Continue journaling through challenges."
              : "Low resilience detected. Consider building stress management and recovery practices."
            }
          </div>
        </div>

        {/* Recovery Success Rate */}
        {recoveryPeriods.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Recovery Success Rate</span>
            <span className="font-semibold text-slate-900">
              {Math.round((recoveryPeriods.filter(p => p.recoveryTimeHours !== null).length / recoveryPeriods.length) * 100)}%
            </span>
          </div>
        )}

        {/* Info Icon */}
        <div className="absolute bottom-3 left-3">
          <div className="group relative">
            <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help" />
            <div className="absolute left-0 bottom-6 w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div><strong>Challenge Detection:</strong> Identifies stressed, frustrated moods and problem-related content</div>
                <div><strong>Recovery Detection:</strong> Looks for confident, accomplished moods and solution keywords within 7 days</div>
                <div><strong>Recovery Success Rate (40%):</strong> Percentage of challenges that led to documented recovery</div>
                <div><strong>Recovery Speed (30%):</strong> Average time from challenge to recovery (faster = better)</div>
                <div><strong>Trend Analysis (30%):</strong> Compares recent vs earlier recovery times</div>
                <div><strong>Resilience Score:</strong> 0-100 composite score of all factors</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}