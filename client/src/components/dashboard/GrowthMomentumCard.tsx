import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { JournalEntry } from '@/types/journal'
import { subDays, isAfter, format, startOfDay, differenceInDays } from 'date-fns'

interface GrowthMomentumCardProps {
  journalEntries: JournalEntry[]
}

interface MomentumData {
  date: string
  score: number
  day: string
}

export function GrowthMomentumCard({ journalEntries }: GrowthMomentumCardProps) {
  const calculateGrowthMomentum = () => {
    if (journalEntries.length === 0) {
      return { 
        currentScore: 0, 
        trend: 'neutral' as const, 
        trendValue: 0, 
        chartData: [],
        highPerformancePeriods: []
      }
    }

    // Get last 14 days for detailed analysis
    const fourteenDaysAgo = subDays(new Date(), 14)
    const recentEntries = journalEntries.filter(entry => 
      isAfter(new Date(entry.created_at), fourteenDaysAgo)
    )

    // Group entries by day and calculate daily momentum scores
    const dailyScores: Record<string, number[]> = {}
    
    recentEntries.forEach(entry => {
      const dateKey = format(startOfDay(new Date(entry.created_at)), 'yyyy-MM-dd')
      if (!dailyScores[dateKey]) dailyScores[dateKey] = []
      
      // Enhanced entry momentum score calculation
      let entryScore = 40 // Lower baseline for more realistic scoring
      
      // 1. Enhanced Mood Analysis (35% weight) - Consistent with other cards
      const mood = entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || ''
      const moodScores: Record<string, number> = {
        // High momentum moods
        'excited': 95, 'accomplished': 100, 'confident': 90, 'motivated': 92,
        'inspired': 94, 'optimistic': 85, 'energized': 88, 'proud': 93,
        'successful': 96, 'determined': 87, 'focused': 82,
        // Medium momentum moods  
        'curious': 75, 'analytical': 70, 'thoughtful': 68, 'reflective': 65,
        'calm': 60, 'satisfied': 72, 'content': 58,
        // Low momentum moods
        'neutral': 50, 'uncertain': 35, 'conflicted': 30, 'disappointed': 25,
        'frustrated': 20, 'stressed': 15, 'overwhelmed': 10, 'tired': 25, 
        'sad': 20, 'anxious': 18, 'worried': 22
      }
      const moodScore = moodScores[mood] || 50
      entryScore += (moodScore - 50) * 0.35

      // 2. Enhanced Category Analysis (25% weight) - Fixed category matching
      const category = entry.sentiment_data?.business_category?.toLowerCase() || entry.category?.toLowerCase() || ''
      const categoryScores: Record<string, number> = {
        'achievement': 95, 'growth': 90, 'planning': 75, 'learning': 70,
        'research': 65, 'challenge': 35 // Challenges can lead to growth but are initially low momentum
      }
      if (categoryScores[category]) {
        entryScore += (categoryScores[category] - 50) * 0.25
      }

      // 3. AI Confidence Integration (15% weight) - New enhancement
      const confidence = entry.sentiment_data?.confidence || 0
      if (confidence > 0) {
        // Normalize confidence (65+ = positive momentum, 85+ = high momentum)
        const confidenceScore = Math.max(0, Math.min(100, (confidence - 45) * 1.5))
        entryScore += (confidenceScore - 50) * 0.15
      }

      // 4. Enhanced Content Analysis (25% weight) - Sophisticated business growth detection
      const content = entry.content.toLowerCase()
      
      // Business growth signals with weighted importance
      const highGrowthSignals = [
        { term: 'breakthrough', weight: 15 }, { term: 'milestone', weight: 15 },
        { term: 'launched', weight: 12 }, { term: 'success', weight: 12 },
        { term: 'achievement', weight: 10 }, { term: 'completed', weight: 10 }
      ]
      const mediumGrowthSignals = [
        { term: 'progress', weight: 8 }, { term: 'growth', weight: 8 },
        { term: 'win', weight: 8 }, { term: 'solved', weight: 7 },
        { term: 'improvement', weight: 7 }, { term: 'opportunity', weight: 6 }
      ]
      const momentumKillers = [
        { term: 'failed', weight: -12 }, { term: 'setback', weight: -10 },
        { term: 'struggle', weight: -8 }, { term: 'stuck', weight: -8 },
        { term: 'behind schedule', weight: -10 }, { term: 'delayed', weight: -7 },
        { term: 'problem', weight: -6 }, { term: 'issue', weight: -5 }
      ]
      
      let contentScore = 0
      
      // Check high-impact growth signals
      highGrowthSignals.forEach(signal => {
        if (content.includes(signal.term)) contentScore += signal.weight
      })
      
      // Check medium-impact growth signals
      mediumGrowthSignals.forEach(signal => {
        if (content.includes(signal.term)) contentScore += signal.weight
      })
      
      // Check momentum killers
      momentumKillers.forEach(signal => {
        if (content.includes(signal.term)) contentScore += signal.weight // Already negative
      })
      
      // Business-specific momentum indicators
      const businessMomentumKeywords = [
        'revenue', 'customers', 'users', 'growth', 'expansion', 'scale',
        'partnership', 'investment', 'funding', 'product launch', 'market share'
      ]
      businessMomentumKeywords.forEach(keyword => {
        if (content.includes(keyword)) contentScore += 5
      })
      
      // Apply content score with proper weighting
      entryScore += Math.max(-40, Math.min(40, contentScore)) * 0.25

      dailyScores[dateKey].push(Math.max(0, Math.min(100, entryScore)))
    })

    // Calculate average daily scores
    const chartData: MomentumData[] = []
    const scores: number[] = []
    
    // Fill in all days in the range, even if no entries
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateKey = format(date, 'yyyy-MM-dd')
      const dayScores = dailyScores[dateKey] || []
      const avgScore = dayScores.length > 0 
        ? dayScores.reduce((sum, score) => sum + score, 0) / dayScores.length
        : 50 // neutral baseline when no entries
      
      chartData.push({
        date: dateKey,
        score: Math.round(avgScore),
        day: format(date, 'MMM dd')
      })
      scores.push(avgScore)
    }

    // Enhanced current momentum calculation
    const currentScore = scores.length > 0 ? Math.round(scores[scores.length - 1]) : 40
    
    // Enhanced trend calculation (balanced comparison periods)
    if (scores.length < 6) {
      // Not enough data for reliable trend
      const trendValue = 0
      const trend = 'neutral'
      return { currentScore, trend, trendValue, chartData, highPerformancePeriods: [] }
    }
    
    // Compare recent 3 days vs earlier 3 days (balanced periods)
    const recentScores = scores.slice(-3)
    const earlierScores = scores.slice(-6, -3)
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    const earlierAvg = earlierScores.reduce((a, b) => a + b, 0) / earlierScores.length
    
    const trendValue = Math.round(recentAvg - earlierAvg)
    
    // More sophisticated trend determination with momentum persistence
    let trend: 'up' | 'down' | 'neutral'
    if (Math.abs(trendValue) < 3) {
      trend = 'neutral' // Reduced sensitivity threshold
    } else {
      // Check for momentum persistence (last 5 days pattern)
      const last5Scores = scores.slice(-5)
      const isConsistentlyRising = last5Scores.every((score, i) => 
        i === 0 || score >= last5Scores[i - 1] - 2 // Allow small fluctuations
      )
      const isConsistentlyFalling = last5Scores.every((score, i) => 
        i === 0 || score <= last5Scores[i - 1] + 2 // Allow small fluctuations
      )
      
      if (trendValue > 0) {
        trend = isConsistentlyRising ? 'up' : (trendValue > 8 ? 'up' : 'neutral')
      } else {
        trend = isConsistentlyFalling ? 'down' : (trendValue < -8 ? 'down' : 'neutral')
      }
    }

    // Enhanced high-performance period detection
    const highPerformancePeriods: string[] = []
    let currentStreak = 0
    
    chartData.forEach((day, index) => {
      if (day.score >= 70) { // Lowered threshold for more realistic detection
        currentStreak++
      } else {
        if (currentStreak >= 2) {
          const startIdx = index - currentStreak
          const endIdx = index - 1
          const avgScore = chartData.slice(startIdx, index)
            .reduce((sum, d) => sum + d.score, 0) / currentStreak
          
          highPerformancePeriods.push(
            `${chartData[startIdx]?.day} - ${chartData[endIdx]?.day} (${Math.round(avgScore)} avg)`
          )
        }
        currentStreak = 0
      }
    })
    
    // Check if current streak continues to end
    if (currentStreak >= 2) {
      const startIdx = chartData.length - currentStreak
      const avgScore = chartData.slice(startIdx)
        .reduce((sum, d) => sum + d.score, 0) / currentStreak
      
      highPerformancePeriods.push(
        `${chartData[startIdx]?.day} - ${chartData[chartData.length - 1]?.day} (${Math.round(avgScore)} avg)`
      )
    }

    return { currentScore, trend, trendValue, chartData, highPerformancePeriods }
  }

  const { currentScore, trend, trendValue, chartData, highPerformancePeriods } = calculateGrowthMomentum()

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
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

  const getMomentumLevel = (score: number) => {
    if (score >= 80) return { level: 'High', color: 'bg-green-50 text-green-700 border-green-200' }
    if (score >= 60) return { level: 'Good', color: 'bg-blue-50 text-blue-700 border-blue-200' }
    if (score >= 40) return { level: 'Moderate', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' }
    return { level: 'Low', color: 'bg-red-50 text-red-700 border-red-200' }
  }

  const momentumLevel = getMomentumLevel(currentScore)

  return (
    <Card className="hover:shadow-lg transition-shadow relative">
      <CardHeader className="pb-3 min-h-[50px] flex items-center">
        <CardTitle className="flex items-center gap-2 text-lg w-full">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Growth Momentum
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-12">
        {/* Status Badge */}
        <div className="flex justify-center mb-3">
          <Badge variant="outline" className={momentumLevel.color}>
            {momentumLevel.level}
          </Badge>
        </div>
        
        {/* Current Score Display */}
        <div className="text-center h-[60px] flex flex-col justify-center">
          <div className={`text-3xl font-bold mb-1 ${
            currentScore >= 75 ? 'text-green-600' :
            currentScore >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {currentScore}
          </div>
          <div className="text-sm text-slate-600">Current Score</div>
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
                currentScore >= 75 ? 'bg-green-500' :
                currentScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(currentScore, 100)}%` }}
            />
          </div>
          {/* Zone labels */}
          <div className="flex justify-between text-xs text-slate-500">
            <span>Low</span>
            <span>Moderate</span>
            <span>High</span>
            <span>Peak</span>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className={`flex items-center justify-center gap-2 mb-4 p-2 rounded-lg bg-slate-50`}>
          {getTrendIcon()}
          <span className={`font-semibold ${getTrendColor()}`}>
            {trend === 'neutral' ? 'Stable trend' : 
             trend === 'up' ? `Trending up ${Math.abs(trendValue)}pts` : 
             `Trending down ${Math.abs(trendValue)}pts`}
          </span>
        </div>

        {/* Line Chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-2 border rounded shadow-lg">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-sm text-blue-600">
                          Momentum: {payload[0].value}%
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ r: 3, fill: '#3B82F6' }}
                activeDot={{ r: 4, fill: '#1D4ED8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* High Performance Periods */}
        {highPerformancePeriods.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-700">Recent High-Performance Periods:</h4>
            <div className="space-y-1">
              {highPerformancePeriods.slice(-2).map((period, index) => (
                <div key={index} className="text-sm text-green-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {period}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="p-3 bg-slate-50 rounded-lg">
          <h4 className="text-sm font-medium text-slate-700 mb-1">Momentum Insights:</h4>
          <div className="text-sm text-slate-600">
            {currentScore >= 80 
              ? "You're in a strong growth phase! Keep leveraging this momentum."
              : currentScore >= 60
              ? "Good momentum building. Look for opportunities to accelerate progress."
              : currentScore >= 40
              ? "Moderate momentum. Focus on consistent small wins to build confidence."
              : "Low momentum detected. Consider reassessing goals and celebrating small achievements."
            }
          </div>
        </div>

        {/* Info Icon */}
        <div className="absolute bottom-3 left-3">
          <div className="group relative">
            <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help" />
            <div className="absolute left-0 bottom-6 w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div><strong>Daily Scoring:</strong> Each day gets 0-100 score based on journal entries</div>
                <div><strong>Mood Impact (40%):</strong> Excited, accomplished, confident = higher scores</div>
                <div><strong>Category Impact (30%):</strong> Achievement, growth = bonus points</div>
                <div><strong>Content Analysis (30%):</strong> Success keywords boost, problem keywords reduce score</div>
                <div><strong>Trend:</strong> Compares last 3 days vs previous 4 days average</div>
                <div><strong>High Performance:</strong> 2+ consecutive days with 75+ scores</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}