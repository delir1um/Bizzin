import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useLocation } from "wouter"
import { useAuth } from "@/hooks/AuthProvider"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays, Calendar, Notebook, File, PlayCircle, Target, TrendingUp, Clock, AlertTriangle, Plus, ArrowRight, BarChart3, PieChart } from "lucide-react"
import { GoalsService } from "@/lib/services/goals"
import { Goal } from "@/types/goals"
import { JournalService } from "@/lib/services/journal"
import type { JournalEntry } from "@/types/journal"
import { format, isAfter, differenceInDays, isToday, differenceInDays as daysDiff } from "date-fns"
import { ConfettiCelebration, CelebrationToast } from "@/components/ConfettiCelebration"
import { ProgressDonutChart } from "@/components/dashboard/ProgressDonutChart"
import { CategoryChart } from "@/components/dashboard/CategoryChart"
import { PriorityProgressBars } from "@/components/dashboard/PriorityProgressBars"
import { DeadlineTimeline } from "@/components/dashboard/DeadlineTimeline"
import { InspirationalQuotes } from "@/lib/inspirationalQuotes"

export function DashboardPage() {
  const { user } = useAuth()
  const [, setLocation] = useLocation()
  const [celebrationTrigger, setCelebrationTrigger] = useState(false)
  const [celebrationToastVisible, setCelebrationToastVisible] = useState(false)
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null)
  
  const navigate = (path: string) => setLocation(path)

  // Fetch user goals data
  const {
    data: goals = [],
    isLoading: goalsLoading,
    error: goalsError
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

  // Calculate goal statistics
  const stats = GoalsService.calculateStats(goals)
  
  // Get recent goals and upcoming deadlines
  const recentGoals = goals.slice(0, 3)
  const upcomingDeadlines = goals
    .filter(goal => goal.status !== 'completed' && goal.deadline)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3)
  
  // Get overdue goals
  const overdueGoals = goals.filter(goal => 
    goal.status !== 'completed' && 
    goal.deadline && 
    isAfter(new Date(), new Date(goal.deadline))
  )
  
  // Get daily inspirational quote
  const dailyQuote = user ? InspirationalQuotes.getDailyInspiration(user) : null

  // Calculate journal insights
  const journalInsights = {
    totalEntries: journalEntries.length,
    todayEntries: journalEntries.filter(entry => isToday(new Date(entry.created_at))).length,
    weeklyEntries: journalEntries.filter(entry => {
      const daysDiff = Math.floor((Date.now() - new Date(entry.created_at).getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff <= 7
    }).length,
    writingStreak: (() => {
      if (journalEntries.length === 0) return 0
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
      const moodCounts = journalEntries.reduce((acc, entry) => {
        if (entry.sentiment_data?.primary_mood) {
          acc[entry.sentiment_data.primary_mood] = (acc[entry.sentiment_data.primary_mood] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
      
      return Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0]
    })(),
    recentEntry: journalEntries
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  }

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
        
        <div className="mt-4 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span>Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {/* Goals Stats - Enhanced */}
        <Card 
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 relative overflow-hidden group" 
          onClick={() => navigate("/goals")}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Total Goals</CardTitle>
            <div className="p-2 bg-orange-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Target className="h-4 w-4 text-white" />
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
                <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-1">{stats.total}</div>
                <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                  {stats.inProgress} in progress
                </p>
                <div className="mt-2 w-full bg-orange-200 dark:bg-orange-800 rounded-full h-1">
                  <div 
                    className="bg-orange-500 h-1 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Goal Completion Rate Enhanced */}
        <Card 
          className={`cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group ${
            stats.successRate >= 70 
              ? 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800'
              : stats.successRate >= 40 
                ? 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950 dark:to-yellow-900 border-amber-200 dark:border-amber-800'
                : 'bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-950 dark:to-pink-900 border-red-200 dark:border-red-800'
          }`}
          onClick={() => navigate("/goals")}
        >
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
            stats.successRate >= 70 ? 'bg-gradient-to-r from-green-500/10 to-transparent'
            : stats.successRate >= 40 ? 'bg-gradient-to-r from-amber-500/10 to-transparent'
            : 'bg-gradient-to-r from-red-500/10 to-transparent'
          }`} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className={`text-sm font-medium ${
              stats.successRate >= 70 ? 'text-green-900 dark:text-green-100' 
              : stats.successRate >= 40 ? 'text-amber-900 dark:text-amber-100' 
              : 'text-red-900 dark:text-red-100'
            }`}>
              Success Rate
            </CardTitle>
            <div className={`p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300 ${
              stats.successRate >= 70 ? 'bg-green-500' 
              : stats.successRate >= 40 ? 'bg-amber-500' 
              : 'bg-red-500'
            }`}>
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            {goalsLoading ? (
              <>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <div className={`text-3xl font-bold mb-1 ${
                  stats.successRate >= 70 ? 'text-green-900 dark:text-green-100' 
                  : stats.successRate >= 40 ? 'text-amber-900 dark:text-amber-100' 
                  : 'text-red-900 dark:text-red-100'
                }`}>
                  {stats.successRate}%
                </div>
                <p className={`text-xs font-medium ${
                  stats.successRate >= 70 ? 'text-green-700 dark:text-green-300' 
                  : stats.successRate >= 40 ? 'text-amber-700 dark:text-amber-300' 
                  : 'text-red-700 dark:text-red-300'
                }`}>
                  {stats.completed} completed goals
                </p>
                <div className="mt-2 w-full bg-white/50 dark:bg-slate-800/50 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-700 ${
                      stats.successRate >= 70 ? 'bg-green-500' 
                      : stats.successRate >= 40 ? 'bg-amber-500' 
                      : 'bg-red-500'
                    }`}
                    style={{ width: `${stats.successRate}%` }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Journal Insights */}
        <Card 
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950 dark:to-indigo-900 border-purple-200 dark:border-purple-800 relative overflow-hidden group" 
          onClick={() => navigate("/journal")}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
              {journalInsights.writingStreak > 0 ? `${journalInsights.writingStreak} Day Streak` : 'Journal'}
            </CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Notebook className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            {journalLoading ? (
              <>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-20" />
              </>
            ) : journalEntries.length > 0 ? (
              <>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
                  {journalInsights.todayEntries || journalInsights.totalEntries}
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                  {journalInsights.todayEntries > 0 
                    ? `${journalInsights.todayEntries} entries today` 
                    : `${journalInsights.totalEntries} total entries`}
                </p>
                <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                  {journalInsights.dominantMood ? 
                    `Mostly ${journalInsights.dominantMood[0].toLowerCase()}` : 
                    'Business reflections'
                  }
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">0</div>
                <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Write your thoughts</p>
                <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                  Start journaling today
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines Enhanced */}
        <Card 
          className={`cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group ${
            overdueGoals.length > 0 
              ? 'bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-950 dark:to-pink-900 border-red-200 dark:border-red-800'
              : upcomingDeadlines.length > 0
                ? 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-900 border-amber-200 dark:border-amber-800'
                : 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800'
          }`}
          onClick={() => navigate("/goals")}
        >
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
              Deadlines
            </CardTitle>
            <div className={`p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300 ${
              overdueGoals.length > 0 ? 'bg-red-500' 
              : upcomingDeadlines.length > 0 ? 'bg-amber-500'
              : 'bg-green-500'
            }`}>
              <Clock className="h-4 w-4 text-white" />
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
                  {overdueGoals.length > 0 ? `${overdueGoals.length} overdue` 
                   : upcomingDeadlines.length > 0 ? 'upcoming' 
                   : 'All on track'}
                </p>
                <div className="mt-2 w-full bg-white/50 dark:bg-slate-800/50 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-500 ${
                      overdueGoals.length > 0 ? 'bg-red-500' 
                      : upcomingDeadlines.length > 0 ? 'bg-amber-500'
                      : 'bg-green-500'
                    }`}
                    style={{ 
                      width: overdueGoals.length > 0 ? '100%' 
                            : upcomingDeadlines.length > 0 ? '60%'
                            : '100%'
                    }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section Enhanced */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Progress Donut Chart Enhanced */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader className="border-b border-blue-100 dark:border-blue-800 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <PieChart className="h-5 w-5 text-blue-600" />
              Goal Progress
            </CardTitle>
            <p className="text-sm text-blue-700 dark:text-blue-300">Overall completion status</p>
          </CardHeader>
          <CardContent className="pt-6">
            {goalsLoading ? (
              <div className="flex items-center justify-center h-48">
                <Skeleton className="w-32 h-32 rounded-full" />
              </div>
            ) : goals.length > 0 ? (
              <ProgressDonutChart goals={goals} />
            ) : (
              <div className="flex items-center justify-center h-48 text-center">
                <div>
                  <PieChart className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">No goals to display</p>
                  <Button 
                    size="sm" 
                    onClick={() => navigate("/goals")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Create Goal
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution Enhanced */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
          <CardHeader className="border-b border-purple-100 dark:border-purple-800 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-900 dark:text-purple-100">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Categories
            </CardTitle>
            <p className="text-sm text-purple-700 dark:text-purple-300">Goal distribution by type</p>
          </CardHeader>
          <CardContent className="pt-6">
            {goalsLoading ? (
              <div className="flex items-center justify-center h-48">
                <Skeleton className="w-32 h-32 rounded-full" />
              </div>
            ) : goals.length > 0 ? (
              <CategoryChart goals={goals} />
            ) : (
              <div className="flex items-center justify-center h-48 text-center">
                <div>
                  <BarChart3 className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">No categories to show</p>
                  <Button 
                    size="sm" 
                    onClick={() => navigate("/goals")}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Add Goals
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Progress Enhanced */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800">
          <CardHeader className="border-b border-orange-100 dark:border-orange-800 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <Target className="h-5 w-5 text-orange-600" />
              Priority Progress
            </CardTitle>
            <p className="text-sm text-orange-700 dark:text-orange-300">Progress by priority level</p>
          </CardHeader>
          <CardContent className="pt-6">
            {goalsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : goals.length > 0 ? (
              <PriorityProgressBars goals={goals} />
            ) : (
              <div className="flex items-center justify-center h-48 text-center">
                <div>
                  <Target className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                  <p className="text-sm text-orange-600 dark:text-orange-400 mb-2">No priority data</p>
                  <Button 
                    size="sm" 
                    onClick={() => navigate("/goals")}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Set Priorities
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Goals Enhanced */}
        <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              Recent Goals
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/goals")}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors"
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {goalsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-2 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentGoals.length > 0 ? (
              <div className="space-y-3">
                {recentGoals.slice(0, 5).map((goal, index) => (
                  <div 
                    key={goal.id} 
                    className="group flex items-center space-x-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-700 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 cursor-pointer transition-all duration-200"
                    onClick={() => navigate("/goals")}
                  >
                    <div className="flex items-center justify-center w-8 h-8">
                      <div className={`w-3 h-3 rounded-full group-hover:scale-110 transition-transform duration-200 ${
                        goal.status === 'completed' ? 'bg-green-500' :
                        goal.status === 'in_progress' ? 'bg-blue-500' :
                        goal.status === 'at_risk' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">
                        {goal.title}
                      </p>
                      <div className="flex items-center space-x-3 mt-1">
                        <Badge 
                          variant={goal.priority === 'high' ? 'destructive' : goal.priority === 'medium' ? 'default' : 'secondary'} 
                          className="text-xs px-2 py-1"
                        >
                          {goal.priority}
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {goal.progress}% complete
                        </span>
                      </div>
                    </div>
                    <div className="w-20">
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            goal.status === 'completed' ? 'bg-green-500' :
                            goal.status === 'in_progress' ? 'bg-blue-500' :
                            goal.status === 'at_risk' ? 'bg-red-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {goals.length > 5 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate("/goals")}
                      className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                    >
                      View {goals.length - 5} more goals <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">No goals yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-48 mx-auto">
                  Start your journey by creating your first business goal
                </p>
                <Button 
                  onClick={() => navigate("/goals")}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Goal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Journal Entries */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between border-b border-purple-100 dark:border-purple-800 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <Notebook className="h-5 w-5 text-purple-600" />
                Recent Reflections
              </CardTitle>
              <p className="text-sm text-purple-700 dark:text-purple-300">Your latest business insights</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/journal")}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors"
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {journalLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded" />
                  </div>
                ))}
              </div>
            ) : journalEntries.length > 0 ? (
              <div className="space-y-3">
                {journalEntries.slice(0, 5).map((entry, index) => {
                  const createdDate = new Date(entry.created_at)
                  const isToday = format(createdDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  const timeAgo = isToday ? 
                    format(createdDate, 'h:mm a') : 
                    format(createdDate, 'MMM d')
                  
                  const getMoodColor = (mood?: string) => {
                    if (!mood) return 'bg-slate-400'
                    const moodColors: Record<string, string> = {
                      'Excited': 'bg-yellow-400',
                      'Motivated': 'bg-green-400',
                      'Focused': 'bg-blue-400',
                      'Confident': 'bg-purple-400',
                      'Optimistic': 'bg-emerald-400',
                      'Grateful': 'bg-pink-400',
                      'Reflective': 'bg-indigo-400',
                      'Challenged': 'bg-orange-400',
                      'Stressed': 'bg-red-400',
                      'Overwhelmed': 'bg-amber-400',
                      'Frustrated': 'bg-rose-400'
                    }
                    return moodColors[mood] || 'bg-slate-400'
                  }
                  
                  return (
                    <div 
                      key={entry.id} 
                      className="group flex items-center gap-4 p-3 rounded-lg border border-purple-100 dark:border-purple-800 hover:border-purple-200 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 cursor-pointer transition-all duration-200"
                      onClick={() => navigate("/journal")}
                    >
                      <div className="flex items-center justify-center w-8 h-8">
                        <div className={`w-3 h-3 rounded-full group-hover:scale-110 transition-transform duration-200 ${
                          getMoodColor(entry.sentiment_data?.primary_mood)
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100 truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                          {entry.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {entry.category && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300">
                              {entry.category}
                            </span>
                          )}
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            {timeAgo}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {entry.sentiment_data?.primary_mood && (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                            {entry.sentiment_data.primary_mood}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {journalEntries.length > 5 && (
                  <div className="pt-2 border-t border-purple-100 dark:border-purple-800">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate("/journal")}
                      className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950"
                    >
                      View {journalEntries.length - 5} more entries <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Notebook className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">No journal entries yet</h3>
                <p className="text-xs text-purple-700 dark:text-purple-300 mb-6 max-w-48 mx-auto">
                  Start documenting your business journey and insights
                </p>
                <Button 
                  onClick={() => navigate("/journal")}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start Journaling
                </Button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-6 border-t border-purple-100 dark:border-purple-800 mt-6">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-4">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="justify-start text-left border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-purple-800 dark:text-purple-200"
                  onClick={() => navigate("/journal")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Write Entry
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="justify-start text-left border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-purple-800 dark:text-purple-200"
                  onClick={() => navigate("/goals")}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Set Goal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivation Section for New Users */}
      {!goalsLoading && goals.length === 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-slate-800 dark:to-slate-700 border border-blue-200 dark:border-slate-600">
          <CardContent className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Welcome to Bizzin!
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm max-w-md">
                Start your entrepreneurial journey by setting your first business goal. Transform your ideas into actionable plans and track your progress.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => navigate("/goals")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Set Your First Goal
              </Button>
              <Button 
                variant="outline"
                className="border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Celebration Components for dashboard goal interactions */}
      <ConfettiCelebration trigger={celebrationTrigger} />
      <CelebrationToast 
        show={celebrationToastVisible}
        goalTitle={completedGoal?.title || ""}
        onComplete={() => {
          setCelebrationToastVisible(false)
          setCompletedGoal(null)
        }}
      />
      </div>
    </div>
  )
}