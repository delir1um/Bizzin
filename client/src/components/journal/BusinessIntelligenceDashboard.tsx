import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  Zap, 
  Target, 
  BookOpen, 
  Sparkles,
  Clock,
  ChevronRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Users,
  BarChart3,
  Brain,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Activity
} from "lucide-react"
import { format, isToday, differenceInDays, startOfWeek, endOfWeek, subDays, startOfMonth, endOfMonth } from "date-fns"
import type { JournalEntry } from "@/types/journal"
import type { Goal } from "@/types/goals"
import { useQuery } from "@tanstack/react-query"
import { GoalsService } from "@/lib/services/goals"
import { useAuth } from "@/hooks/AuthProvider"

interface BusinessIntelligenceDashboardProps {
  entries: JournalEntry[]
  onCreateEntry: () => void
  onViewEntry: (entry: JournalEntry) => void
  onJumpToDate: (date: Date) => void
  onWeekSummary: () => void
}

export function BusinessIntelligenceDashboard({ 
  entries, 
  onCreateEntry, 
  onViewEntry, 
  onJumpToDate,
  onWeekSummary
}: BusinessIntelligenceDashboardProps) {
  const { user } = useAuth()
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('week')

  // Fetch user goals to show business progress
  const { data: userGoals = [] } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => user ? GoalsService.getUserGoals(user.id) : Promise.resolve([]),
    enabled: !!user
  })

  // Calculate writing streak
  const calculateStreakDays = (entries: JournalEntry[]) => {
    if (!entries.length) return 0
    
    const today = new Date()
    let streak = 0
    let currentDate = today
    
    while (streak < 365) { // Max 365 days to prevent infinite loop
      const hasEntry = entries.some(entry => {
        const entryDate = new Date(entry.created_at)
        return entryDate.toDateString() === currentDate.toDateString()
      })
      
      if (hasEntry) {
        streak++
        currentDate = subDays(currentDate, 1)
      } else {
        break
      }
    }
    
    return streak
  }

  const businessIntelligence = useMemo(() => {
    if (!entries.length) return null

    const today = new Date()
    
    // Dynamic date ranges based on selected timeframe
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date
    
    if (selectedTimeframe === 'week') {
      currentStart = startOfWeek(today)
      currentEnd = endOfWeek(today)
      previousStart = startOfWeek(subDays(today, 7))
      previousEnd = endOfWeek(subDays(today, 7))
    } else if (selectedTimeframe === 'month') {
      currentStart = startOfMonth(today)
      currentEnd = endOfMonth(today)
      previousStart = startOfMonth(subDays(today, 30))
      previousEnd = endOfMonth(subDays(today, 30))
    } else { // quarter
      const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
      const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0)
      currentStart = quarterStart
      currentEnd = quarterEnd
      previousStart = new Date(quarterStart.getFullYear(), quarterStart.getMonth() - 3, 1)
      previousEnd = new Date(previousStart.getFullYear(), previousStart.getMonth() + 3, 0)
    }
    
    // Keep original week/month calculations for backwards compatibility
    const weekStart = startOfWeek(today)
    const weekEnd = endOfWeek(today)
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)
    const lastWeekStart = startOfWeek(subDays(today, 7))
    const lastWeekEnd = endOfWeek(subDays(today, 7))

    // Time-based entry filtering (current period)
    const currentPeriodEntries = entries.filter(entry => {
      const entryDate = new Date(entry.created_at)
      return entryDate >= currentStart && entryDate <= currentEnd
    })

    const previousPeriodEntries = entries.filter(entry => {
      const entryDate = new Date(entry.created_at)
      return entryDate >= previousStart && entryDate <= previousEnd
    })

    // Keep original filters for backward compatibility
    const thisWeekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.created_at)
      return entryDate >= weekStart && entryDate <= weekEnd
    })

    const lastWeekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.created_at)
      return entryDate >= lastWeekStart && entryDate <= lastWeekEnd
    })

    const thisMonthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.created_at)
      return entryDate >= monthStart && entryDate <= monthEnd
    })

    // Business Intelligence Metrics
    const businessMetrics = {
      // Strategic Focus Analysis (use current period)
      strategicFocus: currentPeriodEntries.reduce((acc, entry) => {
        const category = entry.sentiment_data?.business_category || entry.category
        if (category) {
          acc[category] = (acc[category] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),

      // Decision Quality Tracking
      decisionPatterns: entries.filter(entry => 
        entry.content.toLowerCase().includes('decision') ||
        entry.content.toLowerCase().includes('pivot') ||
        entry.content.toLowerCase().includes('strategy')
      ).slice(0, 5),

      // Business Momentum Indicators
      momentum: {
        weeklyGrowth: ((currentPeriodEntries.length - previousPeriodEntries.length) / Math.max(previousPeriodEntries.length, 1)) * 100,
        consistencyScore: selectedTimeframe === 'week' 
          ? (currentPeriodEntries.length / 7) * 100 
          : selectedTimeframe === 'month' 
            ? (currentPeriodEntries.length / 30) * 100 
            : (currentPeriodEntries.length / 90) * 100,
        insightDensity: currentPeriodEntries.reduce((total, entry) => 
          total + (entry.sentiment_data?.insights?.length || 0), 0
        )
      },

      // Advanced Goal-Journal Intelligence
      goalProgress: userGoals.map(goal => {
        const relatedEntries = entries.filter(entry => entry.related_goal_id === goal.id)
        const recentActivity = relatedEntries.filter(entry => 
          new Date(entry.created_at) >= weekStart
        ).length
        
        // Calculate goal momentum based on journal patterns
        const sentimentTrend = relatedEntries.slice(-5).map(entry => {
          const mood = entry.sentiment_data?.primary_mood
          return mood === 'excited' || mood === 'confident' || mood === 'optimistic' ? 3 :
                 mood === 'neutral' || mood === 'determined' ? 2 : 1
        })
        
        const avgSentiment = sentimentTrend.length > 0 ? 
          sentimentTrend.reduce((sum, val) => sum + val, 0) / sentimentTrend.length : 2
        
        // Extract business insights specifically related to this goal
        const goalInsights = relatedEntries
          .filter(entry => entry.sentiment_data?.insights?.length)
          .flatMap(entry => entry.sentiment_data!.insights)
          .slice(-3)
        
        // Analyze progress indicators from journal content
        const progressIndicators = relatedEntries.filter(entry => 
          entry.content.toLowerCase().includes('progress') ||
          entry.content.toLowerCase().includes('milestone') ||
          entry.content.toLowerCase().includes('achieved') ||
          entry.content.toLowerCase().includes('completed')
        ).length
        
        // Identify blockers mentioned in journals
        const blockerCount = relatedEntries.filter(entry =>
          entry.content.toLowerCase().includes('blocked') ||
          entry.content.toLowerCase().includes('stuck') ||
          entry.content.toLowerCase().includes('challenge') ||
          entry.content.toLowerCase().includes('obstacle')
        ).length
        
        // Calculate strategic priority based on journal frequency and sentiment
        const strategicPriority = (recentActivity * 2) + (avgSentiment * 1.5) + (progressIndicators * 3)
        
        return {
          ...goal,
          entryCount: relatedEntries.length,
          recentActivity,
          momentum: recentActivity > 0 ? 'active' : 'stalled',
          sentimentTrend: avgSentiment,
          goalInsights,
          progressIndicators,
          blockerCount,
          strategicPriority,
          riskLevel: blockerCount > progressIndicators ? 'high' : 
                    blockerCount > 0 ? 'medium' : 'low'
        }
      }).sort((a, b) => b.strategicPriority - a.strategicPriority),

      // Business Health Indicators (use current period)
      businessHealth: {
        energyTrend: currentPeriodEntries.map(entry => ({
          date: entry.created_at,
          energy: entry.sentiment_data?.energy === 'high' ? 3 : 
                 entry.sentiment_data?.energy === 'medium' ? 2 : 1
        })),
        challengePatterns: currentPeriodEntries.filter(entry =>
          entry.sentiment_data?.primary_mood === 'stressed' ||
          entry.sentiment_data?.primary_mood === 'overwhelmed' ||
          entry.content.toLowerCase().includes('challenge') ||
          entry.content.toLowerCase().includes('problem')
        ),
        opportunitySignals: currentPeriodEntries.filter(entry =>
          entry.sentiment_data?.primary_mood === 'excited' ||
          entry.sentiment_data?.primary_mood === 'optimistic' ||
          entry.content.toLowerCase().includes('opportunity') ||
          entry.content.toLowerCase().includes('growth')
        )
      },

      // Strategic Insights & Actions with Goal Context (use current period)
      strategicInsights: currentPeriodEntries
        .filter(entry => entry.sentiment_data?.insights?.length)
        .flatMap(entry => entry.sentiment_data!.insights)
        .slice(0, 3),

      // Cross-Goal Pattern Analysis
      crossGoalPatterns: {
        // Goals with overlapping challenges
        conflictingGoals: userGoals.filter(goal1 => {
          const goal1Entries = entries.filter(e => e.related_goal_id === goal1.id)
          const goal1Challenges = goal1Entries.filter(e => 
            e.content.toLowerCase().includes('conflict') ||
            e.content.toLowerCase().includes('competing') ||
            e.content.toLowerCase().includes('resource')
          )
          return goal1Challenges.length > 0
        }),

        // Goals with synergistic potential
        synergyOpportunities: userGoals.filter(goal => {
          const relatedEntries = entries.filter(e => e.related_goal_id === goal.id)
          return relatedEntries.some(entry =>
            entry.content.toLowerCase().includes('synergy') ||
            entry.content.toLowerCase().includes('leverage') ||
            entry.content.toLowerCase().includes('combine')
          )
        }),

        // Resource allocation insights
        resourceAllocation: userGoals.map(goal => ({
          ...goal,
          timeInvestment: entries.filter(e => e.related_goal_id === goal.id).length,
          emotionalInvestment: entries
            .filter(e => e.related_goal_id === goal.id)
            .reduce((sum, entry) => {
              const energy = entry.sentiment_data?.energy
              return sum + (energy === 'high' ? 3 : energy === 'medium' ? 2 : 1)
            }, 0)
        })).sort((a, b) => b.emotionalInvestment - a.emotionalInvestment)
      },

      // Advanced Performance Indicators
      kpis: {
        totalEntries: entries.length,
        weeklyEntries: thisWeekEntries.length,
        monthlyEntries: thisMonthEntries.length,
        avgWordsPerEntry: entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.content.split(' ').length, 0) / entries.length : 0,
        streakDays: calculateStreakDays(entries),
        goalAlignment: entries.length > 0 ? (entries.filter(entry => entry.related_goal_id).length / entries.length) * 100 : 0,
        
        // Goal-specific KPIs (use current period)
        activeGoals: userGoals.filter(goal => 
          entries.some(entry => entry.related_goal_id === goal.id && 
          new Date(entry.created_at) >= currentStart)
        ).length,
        stagnantGoals: userGoals.filter(goal => 
          !entries.some(entry => entry.related_goal_id === goal.id && 
          new Date(entry.created_at) >= currentStart)
        ).length,
        goalProgressRate: userGoals.length > 0 ? 
          (currentPeriodEntries.filter(e => e.related_goal_id && 
           e.content.toLowerCase().includes('progress')).length / userGoals.length) : 0,
        
        // Strategic execution metrics (use current period)
        decisionToActionRatio: currentPeriodEntries.filter(e => 
          e.content.toLowerCase().includes('decision')).length / 
          Math.max(currentPeriodEntries.filter(e => 
          e.content.toLowerCase().includes('action')).length, 1),
        strategicReflectionTime: currentPeriodEntries.reduce((sum, entry) => 
          sum + entry.content.split(' ').length, 0) / 60 // Rough minutes estimate
      }
    }

    return businessMetrics
  }, [entries, userGoals, calculateStreakDays, selectedTimeframe])

  if (!businessIntelligence) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
          <BookOpen className="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Welcome to Your Business Intelligence Center
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          Start journaling to unlock powerful insights about your business patterns, decision-making, and strategic opportunities.
        </p>
        <Button 
          onClick={onCreateEntry}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Entry
        </Button>
      </div>
    )
  }

  const { kpis, momentum, businessHealth, strategicFocus, goalProgress, strategicInsights, crossGoalPatterns } = businessIntelligence

  return (
    <div className="space-y-8">
      {/* Strategic Command Center Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-1">
              Strategic Business Intelligence
            </h2>
            <p className="text-orange-700 dark:text-orange-300">
              Real-time insights from your business journey • {selectedTimeframe.charAt(0).toUpperCase() + selectedTimeframe.slice(1)} View
            </p>
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'quarter'].map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe as any)}
                className={selectedTimeframe === timeframe ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Business Momentum</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-1">
                    {momentum.weeklyGrowth > 0 ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    )}
                    {Math.abs(momentum.weeklyGrowth).toFixed(0)}%
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">vs last week</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/30 border-green-200 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Consistency Score</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {momentum.consistencyScore.toFixed(0)}%
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">{kpis.streakDays} day streak</p>
                </div>
                <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Insight Density</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {momentum.insightDensity}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">AI insights this week</p>
                </div>
                <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-purple-700 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/30 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Strategic Execution</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {kpis.activeGoals}/{userGoals.length}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">goals active this week</p>
                </div>
                <div className="w-12 h-12 bg-orange-200 dark:bg-orange-800 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-700 dark:text-orange-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Business Health & Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategic Focus Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              Strategic Focus This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(strategicFocus).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(strategicFocus)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 4)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                        {category}
                      </span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(count / Math.max(...Object.values(strategicFocus))) * 100} 
                          className="w-20 h-2"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[20px]">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">No strategic focus data available</p>
            )}
          </CardContent>
        </Card>

        {/* Business Health Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              Business Health Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">Opportunities</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {businessHealth.opportunitySignals.length}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Challenges</span>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  {businessHealth.challengePatterns.length}
                </Badge>
              </div>

              {businessHealth.energyTrend.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Energy Trend</span>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Avg: {(businessHealth.energyTrend.reduce((sum, day) => sum + day.energy, 0) / businessHealth.energyTrend.length).toFixed(1)}/3
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Goal Intelligence Dashboard */}
      {goalProgress.length > 0 && (
        <div className="space-y-6">
          {/* Strategic Goal Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                Strategic Goal Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goalProgress.slice(0, 6).map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      goal.riskLevel === 'high' 
                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20'
                        : goal.riskLevel === 'medium'
                        ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20'
                        : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-slate-900 dark:text-white text-sm line-clamp-2">
                        {goal.title}
                      </h4>
                      <div className="flex flex-col gap-1">
                        <Badge 
                          variant={goal.momentum === 'active' ? 'default' : 'secondary'}
                          className={goal.momentum === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                        >
                          {goal.momentum}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={`text-xs ${
                            goal.riskLevel === 'high' ? 'border-red-300 text-red-700' :
                            goal.riskLevel === 'medium' ? 'border-yellow-300 text-yellow-700' :
                            'border-green-300 text-green-700'
                          }`}
                        >
                          {goal.riskLevel} risk
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Journal entries:</span>
                        <span className="font-medium">{goal.entryCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">This week:</span>
                        <span className="font-medium">{goal.recentActivity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Progress notes:</span>
                        <span className="font-medium text-green-600">{goal.progressIndicators}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Blockers noted:</span>
                        <span className="font-medium text-red-600">{goal.blockerCount}</span>
                      </div>
                    </div>

                    {goal.goalInsights && goal.goalInsights.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Latest Insight:</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {goal.goalInsights[0]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cross-Goal Strategic Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Allocation Intelligence */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                  Resource Allocation Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {crossGoalPatterns.resourceAllocation.slice(0, 5).map((goal, index) => (
                    <div key={goal.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-slate-900 dark:text-white line-clamp-1">
                          {goal.title}
                        </h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            Time: {goal.timeInvestment} entries
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            Energy: {goal.emotionalInvestment} points
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strategic Conflicts & Synergies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-orange-600" />
                  Strategic Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {crossGoalPatterns.conflictingGoals.length > 0 && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">Potential Conflicts</span>
                      </div>
                      <div className="text-xs text-red-700 dark:text-red-300">
                        {crossGoalPatterns.conflictingGoals.length} goals showing resource conflicts in journal entries
                      </div>
                    </div>
                  )}

                  {crossGoalPatterns.synergyOpportunities.length > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">Synergy Opportunities</span>
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        {crossGoalPatterns.synergyOpportunities.length} goals with potential for strategic alignment
                      </div>
                    </div>
                  )}

                  {kpis.stagnantGoals > 0 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Attention Needed</span>
                      </div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300">
                        {kpis.stagnantGoals} goals with no journal activity this week
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Strategic Insights & Actions */}
      {strategicInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-orange-600" />
              AI Strategic Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strategicInsights.map((insight, index) => (
                <div
                  key={index}
                  className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {insight}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={onCreateEntry}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Strategic Entry
        </Button>

        <Button 
          variant="outline"
          onClick={onWeekSummary}
          className="border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Executive Summary
        </Button>

        <Button 
          variant="outline"
          onClick={() => onJumpToDate(new Date())}
          className="border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Calendar className="w-4 h-4 mr-2" />
          View Timeline
        </Button>
      </div>
    </div>
  )
}