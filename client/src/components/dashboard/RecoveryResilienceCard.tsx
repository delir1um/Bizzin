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

    // Enhanced challenge detection with severity levels - consistent with other cards
    const severeChallengeMoods = ['overwhelmed', 'burned out', 'exhausted', 'desperate', 'devastated']
    const moderateChallengeMoods = ['stressed', 'frustrated', 'anxious', 'pressured', 'worried', 'disappointed']
    const mildChallengeMoods = ['tired', 'sad', 'conflicted', 'uncertain', 'discouraged']
    
    const challengeCategories = ['challenge'] // Consistent case matching
    
    // Enhanced recovery detection with strength levels
    const strongRecoveryMoods = ['accomplished', 'excited', 'confident', 'inspired', 'triumphant', 'energized']
    const moderateRecoveryMoods = ['optimistic', 'motivated', 'determined', 'focused', 'satisfied', 'relieved']
    const mildRecoveryMoods = ['calm', 'peaceful', 'content', 'stable', 'hopeful']
    
    const recoveryCategories = ['achievement', 'growth'] // Consistent case matching

    const recoveryPeriods: RecoveryPeriod[] = []

    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i]
      const mood = (entry.sentiment_data?.primary_mood || entry.mood || '').toLowerCase()
      const category = (entry.sentiment_data?.business_category || entry.category || '').toLowerCase()
      const content = entry.content.toLowerCase()

      // Enhanced challenge detection with severity assessment
      const isSevereChallenge = severeChallengeMoods.includes(mood)
      const isModerateChallenge = moderateChallengeMoods.includes(mood)
      const isMildChallenge = mildChallengeMoods.includes(mood)
      const isChallengeCategory = challengeCategories.includes(category)
      
      // Enhanced content analysis for business challenges
      const severeContentSignals = ['crisis', 'disaster', 'catastrophic', 'devastating', 'bankruptcy']
      const moderateContentSignals = ['problem', 'setback', 'failed', 'struggle', 'difficult', 'major issue']
      const mildContentSignals = ['challenge', 'obstacle', 'concern', 'delay', 'minor issue']
      
      const hasSevereContent = severeContentSignals.some(signal => content.includes(signal))
      const hasModerateContent = moderateContentSignals.some(signal => content.includes(signal))
      const hasMildContent = mildContentSignals.some(signal => content.includes(signal))
      
      const isChallengeEntry = isSevereChallenge || isModerateChallenge || isMildChallenge || 
                              isChallengeCategory || hasSevereContent || hasModerateContent || hasMildContent
      const challengeSeverity = isSevereChallenge || hasSevereContent ? 'severe' :
                               isModerateChallenge || hasModerateContent ? 'moderate' : 'mild'

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

          // Enhanced recovery detection with strength assessment
          const isStrongRecovery = strongRecoveryMoods.includes(laterMood)
          const isModerateRecovery = moderateRecoveryMoods.includes(laterMood)
          const isMildRecovery = mildRecoveryMoods.includes(laterMood)
          const isRecoveryCategory = recoveryCategories.includes(laterCategory)
          
          // Enhanced content analysis for recovery signals
          const strongRecoverySignals = ['breakthrough', 'triumph', 'victory', 'mastered', 'conquered']
          const moderateRecoverySignals = ['solution', 'resolved', 'success', 'progress', 'improvement', 'better']
          const mildRecoverySignals = ['stable', 'okay', 'manageable', 'coping', 'adjusting']
          
          const hasStrongRecoveryContent = strongRecoverySignals.some(signal => laterContent.includes(signal))
          const hasModerateRecoveryContent = moderateRecoverySignals.some(signal => laterContent.includes(signal))
          const hasMildRecoveryContent = mildRecoverySignals.some(signal => laterContent.includes(signal))
          
          // AI confidence integration for recovery validation
          const confidence = laterEntry.sentiment_data?.confidence || 0
          const hasHighConfidence = confidence >= 75
          const hasMediumConfidence = confidence >= 60
          
          const isRecoveryEntry = isStrongRecovery || isModerateRecovery || isMildRecovery || 
                                 isRecoveryCategory || hasStrongRecoveryContent || 
                                 hasModerateRecoveryContent || hasMildRecoveryContent ||
                                 hasHighConfidence
          
          const recoveryStrength = isStrongRecovery || hasStrongRecoveryContent || hasHighConfidence ? 'strong' :
                                  isModerateRecovery || hasModerateRecoveryContent || hasMediumConfidence ? 'moderate' : 'mild'

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

    // Enhanced trend calculation with balanced comparison periods
    let trend: 'up' | 'down' | 'neutral' = 'neutral'
    let trendValue = 0
    
    if (successfulRecoveries.length >= 4) {
      const recentRecoveries = successfulRecoveries.slice(-2) // Last 2 recoveries
      const earlierRecoveries = successfulRecoveries.slice(-4, -2) // Previous 2 recoveries
      
      const recentAvg = recentRecoveries.reduce((sum, p) => sum + (p.recoveryTimeHours || 0), 0) / recentRecoveries.length
      const earlierAvg = earlierRecoveries.reduce((sum, p) => sum + (p.recoveryTimeHours || 0), 0) / earlierRecoveries.length
      
      if (earlierAvg > 0) {
        trendValue = Math.round(((earlierAvg - recentAvg) / earlierAvg) * 100)
        trend = trendValue > 20 ? 'up' : trendValue < -20 ? 'down' : 'neutral'
      }
    }

    // Enhanced resilience scoring algorithm
    let resilienceScore = 40 // Lower baseline for more realistic scoring

    // Factor 1: Recovery Success Rate (30% weight) - Enhanced
    const recoveryRate = recoveryPeriods.length > 0 
      ? (successfulRecoveries.length / recoveryPeriods.length) * 100 
      : 40
    resilienceScore += (recoveryRate - 50) * 0.3

    // Factor 2: Challenge Severity Handling (25% weight) - New factor
    const challengeSeverityScore = recoveryPeriods.length > 0 ? 
      recoveryPeriods.reduce((acc, period) => {
        const challengeMood = (period.challengeEntry.sentiment_data?.primary_mood || period.challengeEntry.mood || '').toLowerCase()
        const challengeContent = period.challengeEntry.content.toLowerCase()
        
        // Assess challenge difficulty
        let difficultyScore = 50
        if (severeChallengeMoods.includes(challengeMood) || challengeContent.includes('crisis')) {
          difficultyScore = 20 // Severe challenges
        } else if (moderateChallengeMoods.includes(challengeMood) || challengeContent.includes('major')) {
          difficultyScore = 35 // Moderate challenges  
        } else {
          difficultyScore = 50 // Mild challenges
        }
        
        // Higher score for recovering from severe challenges
        return acc + (100 - difficultyScore)
      }, 0) / recoveryPeriods.length : 50
    
    resilienceScore += (challengeSeverityScore - 50) * 0.25

    // Factor 3: Recovery Quality & Speed (25% weight) - Enhanced
    if (successfulRecoveries.length > 0) {
      const qualitySpeedScore = successfulRecoveries.reduce((acc, recovery) => {
        const hours = recovery.recoveryTimeHours || 0
        const recoveryMood = (recovery.recoveryEntry?.sentiment_data?.primary_mood || recovery.recoveryEntry?.mood || '').toLowerCase()
        
        // Speed component (0-72 hours range)
        const speedScore = Math.max(20, 100 - (hours / 0.72)) // 72 hours = 20 points, 0 hours = 100 points
        
        // Quality component based on recovery strength
        let qualityBonus = 0
        if (strongRecoveryMoods.includes(recoveryMood)) qualityBonus = 20
        else if (moderateRecoveryMoods.includes(recoveryMood)) qualityBonus = 10
        else qualityBonus = 5
        
        return acc + Math.min(100, speedScore + qualityBonus)
      }, 0) / successfulRecoveries.length
      
      resilienceScore += (qualitySpeedScore - 50) * 0.25
    }

    // Factor 4: Trend & Consistency (20% weight) - Enhanced
    let trendScore = 50
    if (Math.abs(trendValue) > 5) {
      trendScore = 50 + (trendValue * 0.5) // Positive trend increases score
    }
    
    // Consistency bonus for regular recovery patterns
    if (successfulRecoveries.length >= 3) {
      const recoveryTimes = successfulRecoveries.map(r => r.recoveryTimeHours || 0)
      const avgTime = recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
      const variance = recoveryTimes.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / recoveryTimes.length
      const consistency = Math.max(0, 100 - (variance / 100)) // Lower variance = higher consistency
      trendScore += consistency * 0.2
    }
    
    resilienceScore += (trendScore - 50) * 0.2

    // Ensure score stays within realistic bounds
    resilienceScore = Math.max(0, Math.min(100, Math.round(resilienceScore)))

    // Enhanced level determination with refined thresholds
    let level: 'High' | 'Good' | 'Moderate' | 'Low' | 'Unknown'
    if (recoveryPeriods.length === 0) {
      level = 'Unknown' // No challenge data available
    } else if (resilienceScore >= 75) {
      level = 'High' // Robust resilience
    } else if (resilienceScore >= 55) {
      level = 'Good' // Strong resilience
    } else if (resilienceScore >= 35) {
      level = 'Moderate' // Stable resilience  
    } else {
      level = 'Low' // Fragile resilience
    }

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
      <CardHeader className="pb-3 min-h-[50px] flex items-center">
        <CardTitle className="flex items-center gap-2 text-lg w-full">
          <Shield className="h-5 w-5 text-purple-500" />
          Recovery Resilience
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-12">
        {/* Status Badge */}
        <div className="flex justify-center mb-3">
          <Badge variant="outline" className={getLevelColor(level)}>
            {level}
          </Badge>
        </div>
        
        {/* Primary Metric Display */}
        <div className="text-center h-[60px] flex flex-col justify-center">
          <div className={`text-3xl font-bold mb-1 ${
            resilienceScore >= 75 ? 'text-green-600' :
            resilienceScore >= 55 ? 'text-blue-600' :
            resilienceScore >= 35 ? 'text-yellow-600' : 'text-red-600'
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
                resilienceScore >= 55 ? 'bg-blue-500' :
                resilienceScore >= 35 ? 'bg-yellow-500' : 'bg-red-500'
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