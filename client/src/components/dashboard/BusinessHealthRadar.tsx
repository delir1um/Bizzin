import React from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, AlertTriangle, Heart, Info } from 'lucide-react'
import { JournalEntry } from '@/types/journal'
import { subDays, isAfter } from 'date-fns'

interface BusinessHealthRadarProps {
  journalEntries: JournalEntry[]
}

interface RadarData {
  metric: string
  value: number
  fullMark: 100
}

interface BusinessHealthMetrics {
  burnoutRisk: number
  growthMomentum: number
  recoveryResilience: number
  overallHealth: number
}

export function BusinessHealthRadar({ journalEntries }: BusinessHealthRadarProps) {
  // Calculate business health metrics
  const calculateMetrics = (): BusinessHealthMetrics => {
    if (journalEntries.length === 0) {
      return { burnoutRisk: 0, growthMomentum: 0, recoveryResilience: 0, overallHealth: 0 }
    }

    // Get recent entries (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30)
    const recentEntries = journalEntries.filter(entry => 
      isAfter(new Date(entry.created_at), thirtyDaysAgo)
    )

    // 1. Burnout Risk Analysis (lower is better, so we invert it)
    const burnoutRisk = calculateBurnoutRisk(recentEntries)
    const burnoutHealth = Math.max(0, 100 - burnoutRisk) // Invert so high = good

    // 2. Growth Momentum Analysis
    const growthMomentum = calculateGrowthMomentum(recentEntries)

    // 3. Recovery Resilience Analysis
    const recoveryResilience = calculateRecoveryResilience(journalEntries)

    // Overall Health Score
    const overallHealth = Math.round((burnoutHealth + growthMomentum + recoveryResilience) / 3)

    return {
      burnoutRisk: burnoutHealth, // Inverted for display
      growthMomentum,
      recoveryResilience,
      overallHealth
    }
  }

  const calculateBurnoutRisk = (entries: JournalEntry[]): number => {
    if (entries.length === 0) return 0
    if (entries.length < 3) return 20 // Low risk for insufficient data

    let riskScore = 0

    // Enhanced stress mood categorization with severity weighting
    const highStressMoods = ['overwhelmed', 'burned out', 'exhausted', 'desperate']
    const mediumStressMoods = ['stressed', 'frustrated', 'anxious', 'pressured', 'worried']
    const lowStressMoods = ['tired', 'sad', 'conflicted', 'uncertain', 'disappointed']

    // 1. Enhanced Stress/Negative Mood Analysis (40% weight)
    const highStressEntries = entries.filter(entry => 
      highStressMoods.includes(entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || '')
    )
    const mediumStressEntries = entries.filter(entry => 
      mediumStressMoods.includes(entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || '')
    )
    const lowStressEntries = entries.filter(entry => 
      lowStressMoods.includes(entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || '')
    )

    // Weighted stress calculation
    const highStressRatio = highStressEntries.length / entries.length
    const mediumStressRatio = mediumStressEntries.length / entries.length
    const lowStressRatio = lowStressEntries.length / entries.length

    const stressScore = (highStressRatio * 40) + (mediumStressRatio * 25) + (lowStressRatio * 15)
    riskScore += stressScore

    // 2. Enhanced Energy Analysis (30% weight)
    const lowEnergyEntries = entries.filter(entry => 
      entry.sentiment_data?.energy === 'low' || 
      ['tired', 'exhausted', 'drained', 'depleted', 'burned out'].includes(entry.sentiment_data?.primary_mood?.toLowerCase() || '')
    )
    const energyRatio = lowEnergyEntries.length / entries.length
    const energyScore = energyRatio * 30
    riskScore += energyScore

    // 3. Enhanced Work-Life Balance Analysis (30% weight)
    const workStressKeywords = [
      'working late', 'deadline pressure', 'too much work', 'no breaks', 'overwhelm',
      'constant meetings', 'unrealistic expectations', 'work weekends', 'no time'
    ]
    
    const challengeEntries = entries.filter(entry => {
      const isChallenge = entry.sentiment_data?.business_category === 'challenge' || entry.category?.toLowerCase() === 'challenge'
      const hasWorkStress = workStressKeywords.some(keyword => 
        entry.content.toLowerCase().includes(keyword)
      )
      return isChallenge || hasWorkStress
    })
    
    const balanceRatio = challengeEntries.length / entries.length
    const balanceScore = balanceRatio * 30
    riskScore += balanceScore

    // Recovery indicators check (reduce risk)
    const recoveryKeywords = ['took a break', 'went for walk', 'relaxed', 'vacation', 'rest day', 'self-care']
    const recoveryEntries = entries.filter(entry =>
      recoveryKeywords.some(keyword => entry.content.toLowerCase().includes(keyword)) ||
      ['relaxed', 'refreshed', 'recharged', 'peaceful', 'calm'].includes(
        entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || ''
      )
    )
    
    if (recoveryEntries.length > 0) {
      riskScore -= Math.min(15, recoveryEntries.length * 3) // Reduce risk for recovery activities
    }

    // Ensure score stays within bounds
    return Math.max(0, Math.min(100, Math.round(riskScore)))
  }

  const calculateGrowthMomentum = (entries: JournalEntry[]): number => {
    if (entries.length === 0) return 0
    if (entries.length < 3) return 30 // Neutral momentum for insufficient data

    let momentumScore = 0
    const weights = { growth: 0.35, confidence: 0.25, achievements: 0.25, positivity: 0.15 }

    // 1. Growth category frequency (35% weight) - Fixed category matching
    const growthEntries = entries.filter(entry => 
      entry.sentiment_data?.business_category?.toLowerCase() === 'growth' ||
      entry.category?.toLowerCase() === 'growth'
    )
    // More realistic expectation: 15% of entries should be growth-focused (not 30%)
    const growthRatio = growthEntries.length / entries.length
    const growthScore = Math.min(100, (growthRatio / 0.15) * 100)
    momentumScore += growthScore * weights.growth

    // 2. Enhanced Confidence Analysis (25% weight)
    const validConfidenceEntries = entries.filter(entry => 
      entry.sentiment_data?.confidence && entry.sentiment_data.confidence > 0
    )
    
    if (validConfidenceEntries.length > 0) {
      const avgConfidence = validConfidenceEntries.reduce((sum, entry) => 
        sum + (entry.sentiment_data?.confidence || 0), 0
      ) / validConfidenceEntries.length
      
      // Normalize confidence: 65+ = good momentum, 85+ = excellent
      const confidenceScore = Math.max(0, Math.min(100, (avgConfidence - 45) * 2))
      momentumScore += confidenceScore * weights.confidence
    } else {
      // Fallback: analyze positive moods for confidence proxy
      const confidentMoods = ['confident', 'excited', 'motivated', 'optimistic', 'inspired']
      const confidentEntries = entries.filter(entry =>
        confidentMoods.includes(entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || '')
      )
      const moodConfidenceScore = Math.min(100, (confidentEntries.length / entries.length) * 200)
      momentumScore += moodConfidenceScore * weights.confidence
    }

    // 3. Enhanced Achievement Analysis (25% weight) - Fixed category matching
    const achievementEntries = entries.filter(entry => 
      entry.sentiment_data?.business_category?.toLowerCase() === 'achievement' ||
      entry.category?.toLowerCase() === 'achievement' ||
      ['excited', 'confident', 'accomplished', 'proud', 'successful'].includes(
        entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || ''
      )
    )
    // More realistic expectation: 10% should be achievements (not 20%)
    const achievementRatio = achievementEntries.length / entries.length
    const achievementScore = Math.min(100, (achievementRatio / 0.10) * 100)
    momentumScore += achievementScore * weights.achievements

    // 4. Overall Positivity Indicator (15% weight)
    const positiveMoods = ['excited', 'confident', 'motivated', 'accomplished', 'inspired', 'optimistic', 'energized']
    const positiveEntries = entries.filter(entry =>
      positiveMoods.includes(entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || '')
    )
    const positivityRatio = positiveEntries.length / entries.length
    const positivityScore = Math.min(100, positivityRatio * 150) // 67% positive = 100 points
    momentumScore += positivityScore * weights.positivity

    // Time-weighted recent momentum boost
    const last7Days = subDays(new Date(), 7)
    const recentEntries = entries.filter(entry => isAfter(new Date(entry.created_at), last7Days))
    
    if (recentEntries.length > 0) {
      const recentPositiveRatio = recentEntries.filter(entry =>
        positiveMoods.includes(entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || '')
      ).length / recentEntries.length
      
      // Boost for strong recent momentum
      if (recentPositiveRatio > 0.6) {
        momentumScore += 10
      }
    }

    return Math.max(0, Math.min(100, Math.round(momentumScore)))
  }

  const calculateRecoveryResilience = (allEntries: JournalEntry[]): number => {
    if (allEntries.length < 5) return 50 // Not enough data

    // Find challenge periods and recovery times
    const challengeEntries = allEntries.filter(entry => 
      entry.sentiment_data?.business_category === 'Challenge' ||
      entry.category === 'Challenge' ||
      ['stressed', 'frustrated', 'overwhelmed'].includes(entry.sentiment_data?.primary_mood?.toLowerCase() || '')
    )

    if (challengeEntries.length === 0) return 80 // No challenges = good resilience

    let totalRecoveryScore = 0
    let recoveryInstances = 0

    // Analyze recovery after each challenge
    challengeEntries.forEach(challengeEntry => {
      const challengeDate = new Date(challengeEntry.created_at)
      
      // Look for positive entries within 7 days after challenge
      const recoveryEntries = allEntries.filter(entry => {
        const entryDate = new Date(entry.created_at)
        const daysDiff = (entryDate.getTime() - challengeDate.getTime()) / (1000 * 60 * 60 * 24)
        return daysDiff > 0 && daysDiff <= 7 && (
          ['confident', 'excited', 'accomplished', 'optimistic'].includes(
            entry.sentiment_data?.primary_mood?.toLowerCase() || ''
          ) || (entry.sentiment_data?.confidence || 0) > 70
        )
      })

      if (recoveryEntries.length > 0) {
        // Faster recovery = higher score
        const firstRecovery = recoveryEntries.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )[0]
        const recoveryDays = (new Date(firstRecovery.created_at).getTime() - challengeDate.getTime()) / (1000 * 60 * 60 * 24)
        const recoveryScore = Math.max(0, 100 - (recoveryDays * 15)) // 1 day = 85 points, 7 days = 0 points
        totalRecoveryScore += recoveryScore
        recoveryInstances++
      }
    })

    if (recoveryInstances === 0) return 30 // Challenges but no recovery pattern

    return Math.min(100, Math.round(totalRecoveryScore / recoveryInstances))
  }

  const metrics = calculateMetrics()

  const data: RadarData[] = [
    {
      metric: 'Stress Management',
      value: metrics.burnoutRisk,
      fullMark: 100,
    },
    {
      metric: 'Growth Momentum',
      value: metrics.growthMomentum,
      fullMark: 100,
    },
    {
      metric: 'Recovery Resilience',
      value: metrics.recoveryResilience,
      fullMark: 100,
    },
  ]

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400'
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getHealthBadge = (score: number) => {
    if (score >= 80) return { text: 'Excellent', color: 'bg-green-100 text-green-800 border-green-200' }
    if (score >= 65) return { text: 'Good', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    if (score >= 50) return { text: 'Fair', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    return { text: 'Needs Attention', color: 'bg-red-100 text-red-800 border-red-200' }
  }

  const overallBadge = getHealthBadge(metrics.overallHealth)

  return (
    <Card className="hover:shadow-lg transition-shadow relative">
      <CardHeader className="pb-3 min-h-[50px] flex items-center">
        <CardTitle className="flex items-center gap-2 text-lg w-full">
          <Heart className="h-5 w-5 text-purple-500" />
          Business Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-12">
        {/* Status Badge */}
        <div className="flex justify-center mb-3">
          <Badge variant="outline" className={overallBadge.color}>
            {overallBadge.text}
          </Badge>
        </div>
        
        {/* Overall Score */}
        <div className="text-center h-[60px] flex flex-col justify-center">
          <div className={`text-3xl font-bold mb-1 ${getHealthColor(metrics.overallHealth)}`}>
            {metrics.overallHealth}
          </div>
          <div className="text-sm text-slate-600">Overall Score</div>
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
                metrics.overallHealth >= 80 ? 'bg-green-500' :
                metrics.overallHealth >= 65 ? 'bg-blue-500' :
                metrics.overallHealth >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(metrics.overallHealth, 100)}%` }}
            />
          </div>
          {/* Zone labels */}
          <div className="flex justify-between text-xs text-slate-500">
            <span>Poor</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Compact Radar Chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <PolarGrid 
                stroke="#8B5CF6" 
                strokeOpacity={0.3}
              />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ 
                  fontSize: 9, 
                  fill: '#7C3AED',
                  fontWeight: 500
                }}
                className="text-purple-700 dark:text-purple-300"
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fontSize: 8, fill: '#8B5CF6' }}
                tickCount={3}
              />
              <Radar
                name="Business Health"
                dataKey="value"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.3}
                strokeWidth={2}
                dot={{ fill: '#7C3AED', strokeWidth: 1, r: 3 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Compact Metric Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Stress Mgmt
            </span>
            <span className={`font-bold ${getHealthColor(metrics.burnoutRisk)}`}>
              {metrics.burnoutRisk}%
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Growth
            </span>
            <span className={`font-bold ${getHealthColor(metrics.growthMomentum)}`}>
              {metrics.growthMomentum}%
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              Recovery
            </span>
            <span className={`font-bold ${getHealthColor(metrics.recoveryResilience)}`}>
              {metrics.recoveryResilience}%
            </span>
          </div>
        </div>

        {/* Overall Health Insight */}
        <div className="p-3 bg-slate-50 rounded-lg">
          <h4 className="text-sm font-medium text-slate-700 mb-1">Health Insights:</h4>
          <div className="text-sm text-slate-600">
            {metrics.overallHealth >= 80 
              ? "Excellent business wellness across all metrics!"
              : metrics.overallHealth >= 65
              ? "Good overall health with room for targeted improvements."
              : metrics.overallHealth >= 50
              ? "Fair health status. Focus on stress management and growth."
              : "Health needs attention. Prioritize self-care and recovery."
            }
          </div>
        </div>

        {/* Info Icon */}
        <div className="absolute bottom-3 left-3">
          <div className="group relative">
            <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help" />
            <div className="absolute left-0 bottom-6 w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div><strong>Overall Score:</strong> Average of all three metrics</div>
                <div><strong>Stress Mgmt:</strong> Based on mood patterns, energy levels, and work-life balance indicators from journal entries</div>
                <div><strong>Growth:</strong> Calculated from positive moods, achievement categories, and progress-related content</div>
                <div><strong>Recovery:</strong> Measures time taken to bounce back from challenges and setbacks</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}