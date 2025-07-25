import React, { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/AuthProvider'
import { GoalsService } from '@/lib/services/goals'
import { Goal } from '@/types/goals'
import { JournalService } from '@/lib/services/journal'
import { InspirationalQuotes } from '@/lib/inspirationalQuotes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedGrid, AnimatedItem } from '@/components/ui/animated-card'
import { ConfettiCelebration, CelebrationToast } from '@/components/ConfettiCelebration'
import {
  Target, TrendingUp, Clock, AlertTriangle, File, Flame, 
  Brain, Plus, ArrowRight, PlayCircle, BarChart3, Notebook
} from 'lucide-react'
import { isToday, format, subDays, differenceInDays } from 'date-fns'

export function DashboardPage() {
  const [, setLocation] = useLocation()
  const { user } = useAuth()
  const [celebrationTrigger, setCelebrationTrigger] = useState(false)
  const [celebrationToastVisible, setCelebrationToastVisible] = useState(false)
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null)
  
  const navigate = (path: string) => setLocation(path)

  // Fetch user goals data
  const {
    data: goals = [],
    isLoading: goalsLoading,
  } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => user ? GoalsService.getUserGoals(user.id) : Promise.resolve([]),
    enabled: !!user
  })

  // Fetch journal entries for insights
  const {
    data: journalEntries = [],
    isLoading: journalLoading,
  } = useQuery({
    queryKey: ['journal-entries', user?.id],
    queryFn: () => user ? JournalService.getUserEntries(user.id) : Promise.resolve([]),
    enabled: !!user
  })

  // Calculate comprehensive business intelligence stats from all features
  const stats = GoalsService.calculateStats(goals)

  // Goals Intelligence
  const overdueGoals = goals.filter(goal => 
    goal.target_date && new Date() > new Date(goal.target_date) && goal.status !== 'completed'
  )
  
  const upcomingDeadlines = goals.filter(goal => 
    goal.target_date && 
    new Date() <= new Date(goal.target_date) && 
    differenceInDays(new Date(goal.target_date), new Date()) <= 7 &&
    goal.status !== 'completed'
  ).sort((a, b) => new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime())

  // Journal Intelligence
  const journalInsights = {
    totalEntries: journalEntries.length,
    todayEntries: journalEntries.filter(entry => isToday(new Date(entry.created_at))).length,
    thisWeekEntries: journalEntries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      const weekAgo = subDays(new Date(), 7);
      return entryDate >= weekAgo;
    }).length,
    writingStreak: (() => {
      if (journalEntries.length === 0) return 0;
      
      const uniqueDates = Array.from(new Set(journalEntries.map(entry => 
        format(new Date(entry.created_at), 'yyyy-MM-dd')
      ))).sort().reverse()
      
      let streak = 0
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      
      if (uniqueDates.includes(todayStr)) {
        streak = 1
        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = new Date(uniqueDates[i-1])
          const currDate = new Date(uniqueDates[i])
          if (Math.abs(differenceInDays(prevDate, currDate)) === 1) {
            streak++
          } else {
            break
          }
        }
      }
      return streak
    })(),
    dominantMood: (() => {
      const recentEntries = journalEntries.filter(entry => {
        const entryDate = new Date(entry.created_at);
        const weekAgo = subDays(new Date(), 7);
        return entryDate >= weekAgo;
      });
      
      const moodCounts = recentEntries.reduce((acc, entry) => {
        if (entry.sentiment_data?.primary_mood) {
          acc[entry.sentiment_data.primary_mood] = (acc[entry.sentiment_data.primary_mood] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
      
      return Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0]
    })(),
    avgConfidence: (() => {
      const recentEntries = journalEntries.filter(entry => {
        const entryDate = new Date(entry.created_at);
        const weekAgo = subDays(new Date(), 7);
        return entryDate >= weekAgo && entry.sentiment_data?.confidence_score;
      });
      
      if (recentEntries.length === 0) return 0;
      
      const totalConfidence = recentEntries.reduce((sum, entry) => 
        sum + (entry.sentiment_data?.confidence_score || 0), 0);
      return Math.round(totalConfidence / recentEntries.length);
    })(),
    goalLinkedEntries: journalEntries.filter(entry => entry.related_goal_id).length
  }

  // Business Health Score (AI-derived from goals + journal)
  const businessHealthScore = (() => {
    let score = 50; // Base score
    
    // Goals contribution (40% of score)
    if (stats.total > 0) {
      score += (stats.completed / stats.total) * 20; // Up to +20 for completion rate
      score += Math.min(stats.inProgress, 5) * 2; // Up to +10 for active goals
      score -= Math.min(overdueGoals.length, 3) * 5; // -5 per overdue (max -15)
    }
    
    // Journal contribution (30% of score)
    if (journalInsights.writingStreak > 0) {
      score += Math.min(journalInsights.writingStreak, 7) * 2; // Up to +14 for streak
    }
    if (journalInsights.avgConfidence > 0) {
      score += ((journalInsights.avgConfidence - 50) / 50) * 10; // Confidence impact
    }
    
    // Integration bonus (10% of score) 
    if (journalInsights.goalLinkedEntries > 0) {
      score += Math.min(journalInsights.goalLinkedEntries, 5) * 2; // Up to +10 for integration
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  })()

  // Get daily quote
  const dailyQuote = InspirationalQuotes.getDailyInspiration(user)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Welcome Section with Inspirational Quote */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back, <span className="text-orange-600">
              {user?.user_metadata?.full_name || 
               user?.user_metadata?.first_name || 
               user?.email?.split('@')[0] || 
               "Entrepreneur"}
            </span>!
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2 text-lg">Plan. Track. Grow.</p>
          
          {/* Daily Inspirational Quote */}
          {dailyQuote && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
              <blockquote className="text-slate-700 dark:text-slate-300 italic text-base leading-relaxed">
                "{dailyQuote.text}"
              </blockquote>
              <div className="flex items-center justify-between mt-3">
                <cite className="text-sm text-orange-600 dark:text-orange-400 font-medium not-italic">
                  — {dailyQuote.author}
                </cite>
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full capitalize">
                  {dailyQuote.category}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-slate-500 dark:text-slate-400">Your strategic business command center</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Primary Business Metrics - Most Important */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Business Health Score - Hero Metric */}
          <AnimatedItem>
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900 border-emerald-200 dark:border-emerald-800 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-base font-semibold text-emerald-900 dark:text-emerald-100">Business Health</CardTitle>
                <div className="p-3 bg-emerald-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                  {businessHealthScore}/100
                </div>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium mb-3">
                  AI-powered business score
                </p>
                <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-3">
                  <div 
                    className="bg-emerald-500 h-3 rounded-full transition-all duration-700" 
                    style={{ width: `${businessHealthScore}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </AnimatedItem>

          {/* Active Goals */}
          <AnimatedItem>
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 relative overflow-hidden group" onClick={() => navigate("/goals")}>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-base font-semibold text-orange-900 dark:text-orange-100">Active Goals</CardTitle>
                <div className="p-3 bg-orange-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {goalsLoading ? (
                  <>
                    <Skeleton className="h-10 w-16 mb-2" />
                    <Skeleton className="h-5 w-24" />
                  </>
                ) : (
                  <>
                    <div className="text-4xl font-bold text-orange-900 dark:text-orange-100 mb-2">{stats.inProgress}</div>
                    <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                      {stats.completed} completed
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </AnimatedItem>

          {/* Writing Streak */}
          <AnimatedItem>
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950 dark:to-indigo-900 border-purple-200 dark:border-purple-800 relative overflow-hidden group" onClick={() => navigate("/journal")}>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-base font-semibold text-purple-900 dark:text-purple-100">Writing Streak</CardTitle>
                <div className="p-3 bg-purple-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Flame className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {journalLoading ? (
                  <>
                    <Skeleton className="h-10 w-16 mb-2" />
                    <Skeleton className="h-5 w-24" />
                  </>
                ) : (
                  <>
                    <div className="text-4xl font-bold text-purple-900 dark:text-purple-100 mb-2">{journalInsights.writingStreak}</div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                      {journalInsights.thisWeekEntries} this week
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </AnimatedItem>
        </div>

        {/* Secondary Metrics & Alerts */}
        <AnimatedGrid className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {/* Urgent Actions - Critical Alert */}
          <AnimatedItem>
            <Card className={`cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group ${
              overdueGoals.length > 0 
                ? 'bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-950 dark:to-pink-900 border-red-200 dark:border-red-800'
                : upcomingDeadlines.length > 0
                  ? 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-900 border-amber-200 dark:border-amber-800'
                  : 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800'
            }`} onClick={() => navigate("/goals")}>
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                overdueGoals.length > 0 ? 'bg-gradient-to-r from-red-500/10 to-transparent'
                : upcomingDeadlines.length > 0 ? 'bg-gradient-to-r from-amber-500/10 to-transparent'
                : 'bg-gradient-to-r from-green-500/10 to-transparent'
              }`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className={`text-sm font-medium ${
                  overdueGoals.length > 0 ? 'text-red-900 dark:text-red-100' 
                  : upcomingDeadlines.length > 0 ? 'text-amber-900 dark:text-amber-100'
                  : 'text-green-900 dark:text-green-100'
                }`}>
                  Urgent Actions
                </CardTitle>
                <div className={`p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                  overdueGoals.length > 0 ? 'bg-red-500' 
                  : upcomingDeadlines.length > 0 ? 'bg-amber-500'
                  : 'bg-green-500'
                }`}>
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {goalsLoading ? (
                  <>
                    <Skeleton className="h-8 w-12 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </>
                ) : (
                  <>
                    <div className={`text-3xl font-bold mb-1 ${
                      overdueGoals.length > 0 ? 'text-red-900 dark:text-red-100' 
                      : upcomingDeadlines.length > 0 ? 'text-amber-900 dark:text-amber-100'
                      : 'text-green-900 dark:text-green-100'
                    }`}>
                      {overdueGoals.length > 0 ? overdueGoals.length : upcomingDeadlines.length}
                    </div>
                    <p className={`text-xs font-medium ${
                      overdueGoals.length > 0 ? 'text-red-700 dark:text-red-300' 
                      : upcomingDeadlines.length > 0 ? 'text-amber-700 dark:text-amber-300'
                      : 'text-green-700 dark:text-green-300'
                    }`}>
                      {overdueGoals.length > 0 ? 'overdue goals' 
                       : upcomingDeadlines.length > 0 ? 'due this week' 
                       : 'all on track'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </AnimatedItem>

          {/* Storage Status */}
          <AnimatedItem>
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 border-blue-200 dark:border-blue-800 relative overflow-hidden group" onClick={() => navigate("/docsafe")}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Storage</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <File className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">47MB</div>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  of 50MB used
                </p>
              </CardContent>
            </Card>
          </AnimatedItem>

          {/* Weekly Business Mood */}
          <AnimatedItem>
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-950 dark:to-blue-900 border-indigo-200 dark:border-indigo-800 relative overflow-hidden group" onClick={() => navigate("/journal")}>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Dominant Mood</CardTitle>
                <div className="p-2 bg-indigo-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {journalLoading ? (
                  <>
                    <Skeleton className="h-8 w-20 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mb-1 capitalize">
                      {journalInsights.dominantMood?.[0] || 'Confident'}
                    </div>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                      {journalInsights.goalLinkedEntries} goal-linked entries
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </AnimatedItem>

          {/* Growth Wins */}
          <AnimatedItem>
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800 relative overflow-hidden group" onClick={() => navigate("/journal")}>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Growth Wins</CardTitle>
                <div className="p-2 bg-green-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {journalLoading ? (
                  <>
                    <Skeleton className="h-8 w-12 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">
                      {journalEntries.filter(entry => 
                        entry.sentiment_data?.business_category === 'Growth' || 
                        entry.category === 'Growth'
                      ).length}
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                      growth entries
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </AnimatedItem>
        </AnimatedGrid>

        {/* Quick Actions & Critical Insights */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Next 3 Urgent Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <Card className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-900 border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Upcoming Deadlines
                </CardTitle>
                <p className="text-sm text-amber-700 dark:text-amber-300">Goals requiring attention this week</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingDeadlines.slice(0, 3).map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-amber-100 dark:border-amber-700">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{goal.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Due: {goal.target_date ? format(new Date(goal.target_date), 'MMM dd') : 'No date'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {goal.progress}%
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4 border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => navigate("/goals")}
                >
                  View All Goals <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Weekly Business Intelligence */}
          {journalInsights.dominantMood && (
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950 dark:to-indigo-900 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Weekly Business Mood
                </CardTitle>
                <p className="text-sm text-purple-700 dark:text-purple-300">AI analysis of your business mindset</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-purple-100 dark:border-purple-700">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200 capitalize">
                        {journalInsights.dominantMood[0]}
                      </Badge>
                      <span className="text-2xl font-bold text-purple-600">
                        {journalInsights.avgConfidence}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Confidence level • {journalInsights.thisWeekEntries} entries analyzed
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-purple-600">
                      {journalInsights.goalLinkedEntries}
                    </div>
                    <p className="text-xs text-slate-500">Goal-linked entries</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4 border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={() => navigate("/journal")}
                >
                  Add Journal Entry <Plus className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Platform Features - Organized by Function */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Platform Features</h3>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-800" onClick={() => navigate("/training")}>
                <CardContent className="p-6 text-center">
                  <PlayCircle className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Training</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">2 courses active</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800" onClick={() => navigate("/bizbuilder")}>
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-10 w-10 text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">BizBuilder</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">3 tools available</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800" onClick={() => navigate("/docsafe")}>
                <CardContent className="p-6 text-center">
                  <File className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">DocSafe</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">3 documents stored</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border-purple-200 dark:border-purple-800" onClick={() => navigate("/journal")}>
                <CardContent className="p-6 text-center">
                  <Notebook className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Journal</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{journalInsights.writingStreak} day streak</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <ConfettiCelebration 
        trigger={celebrationTrigger} 
        onComplete={() => setCelebrationTrigger(false)} 
      />
      
      <CelebrationToast 
        show={celebrationToastVisible}
        goalTitle={completedGoal?.title || ""}
        onComplete={() => setCelebrationToastVisible(false)}
      />
    </div>
  )
}