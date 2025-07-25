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
      
      // Calculate entry momentum score based on mood, category, and content
      let entryScore = 50 // baseline
      
      // Mood contribution (40% weight)
      const mood = entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || ''
      const moodScores: Record<string, number> = {
        'excited': 90, 'accomplished': 95, 'confident': 85, 'motivated': 88,
        'inspired': 92, 'optimistic': 80, 'focused': 75, 'determined': 85,
        'curious': 70, 'analytical': 65, 'thoughtful': 60, 'reflective': 60,
        'neutral': 50, 'uncertain': 40, 'conflicted': 35, 'frustrated': 25,
        'stressed': 20, 'overwhelmed': 15, 'tired': 30, 'sad': 25
      }
      entryScore += (moodScores[mood] - 50) * 0.4

      // Category contribution (30% weight) 
      const category = entry.sentiment_data?.business_category?.toLowerCase() || entry.category?.toLowerCase() || ''
      const categoryScores: Record<string, number> = {
        'achievement': 90, 'growth': 85, 'planning': 70, 'learning': 65,
        'research': 60, 'challenge': 40
      }
      if (categoryScores[category]) {
        entryScore += (categoryScores[category] - 50) * 0.3
      }

      // Content signals (30% weight)
      const content = entry.content.toLowerCase()
      const positiveSignals = [
        'success', 'win', 'breakthrough', 'growth', 'progress', 'achievement',
        'excited', 'accomplished', 'milestone', 'launched', 'completed', 'solved'
      ]
      const negativeSignals = [
        'failed', 'struggle', 'problem', 'issue', 'stuck', 'difficult',
        'frustrat', 'stress', 'overwhelm', 'behind', 'delay'
      ]
      
      let contentBonus = 0
      positiveSignals.forEach(signal => {
        if (content.includes(signal)) contentBonus += 10
      })
      negativeSignals.forEach(signal => {
        if (content.includes(signal)) contentBonus -= 10
      })
      entryScore += Math.max(-30, Math.min(30, contentBonus)) * 0.3

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

    // Calculate current momentum and trend
    const currentScore = scores.length > 0 ? Math.round(scores[scores.length - 1]) : 50
    
    // Calculate trend (comparing last 3 days vs previous 4 days)
    const recentScores = scores.slice(-3)
    const earlierScores = scores.slice(-7, -3)
    const recentAvg = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 50
    const earlierAvg = earlierScores.length > 0 ? earlierScores.reduce((a, b) => a + b, 0) / earlierScores.length : 50
    
    const trendValue = Math.round(recentAvg - earlierAvg)
    const trend = trendValue > 5 ? 'up' : trendValue < -5 ? 'down' : 'neutral'

    // Identify high-performance periods (consecutive days with score > 75)
    const highPerformancePeriods: string[] = []
    let currentStreak = 0
    chartData.forEach((day, index) => {
      if (day.score >= 75) {
        currentStreak++
      } else {
        if (currentStreak >= 2) {
          const startIdx = index - currentStreak
          const endIdx = index - 1
          highPerformancePeriods.push(
            `${chartData[startIdx]?.day} - ${chartData[endIdx]?.day} (${currentStreak} days)`
          )
        }
        currentStreak = 0
      }
    })
    
    // Check if current streak continues to end
    if (currentStreak >= 2) {
      const startIdx = chartData.length - currentStreak
      highPerformancePeriods.push(
        `${chartData[startIdx]?.day} - ${chartData[chartData.length - 1]?.day} (${currentStreak} days)`
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Growth Momentum
          </span>
          <Badge variant="outline" className={momentumLevel.color}>
            {momentumLevel.level}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Score Display */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-slate-900">{currentScore}</div>
          <div className="text-sm text-slate-600">Current Score</div>
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