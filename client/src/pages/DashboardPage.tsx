import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useLocation } from "wouter"
import { useAuth } from "@/hooks/AuthProvider"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays, Notebook, File, PlayCircle, Target, TrendingUp, Clock, AlertTriangle, Plus, ArrowRight, BarChart3, PieChart } from "lucide-react"
import { GoalsService } from "@/lib/services/goals"
import { Goal } from "@/types/goals"
import { format, isAfter, differenceInDays } from "date-fns"
import { ConfettiCelebration, CelebrationToast } from "@/components/ConfettiCelebration"
import { ProgressDonutChart } from "@/components/dashboard/ProgressDonutChart"
import { CategoryChart } from "@/components/dashboard/CategoryChart"
import { PriorityProgressBars } from "@/components/dashboard/PriorityProgressBars"
import { DeadlineTimeline } from "@/components/dashboard/DeadlineTimeline"

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

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl p-6 border border-orange-200/50 dark:border-orange-800/50">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Welcome back, <span className="text-orange-600">{user?.email?.split('@')[0] ?? "Entrepreneur"}</span>!
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2 text-lg">Plan. Track. Grow.</p>
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

        {/* Journal Entry Count */}
        <Card 
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950 dark:to-indigo-900 border-purple-200 dark:border-purple-800 relative overflow-hidden group" 
          onClick={() => navigate("/journal")}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Journal</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Notebook className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">-</div>
            <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Write your thoughts</p>
            <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
              Start journaling today
            </div>
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

      {/* Charts Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Progress Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="flex items-center justify-center h-48">
                <Skeleton className="w-32 h-32 rounded-full" />
              </div>
            ) : (
              <ProgressDonutChart goals={goals} />
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="flex items-center justify-center h-48">
                <Skeleton className="w-32 h-32 rounded-full" />
              </div>
            ) : (
              <CategoryChart goals={goals} />
            )}
          </CardContent>
        </Card>

        {/* Priority Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Priority Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <PriorityProgressBars goals={goals} />
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
          <CardContent className="space-y-4">
            {goalsLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </>
            ) : recentGoals.length > 0 ? (
              recentGoals.map((goal) => (
                <div 
                  key={goal.id} 
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate("/goals")}
                >
                  <div className={`w-3 h-3 rounded-full ${
                    goal.status === 'completed' ? 'bg-green-500' :
                    goal.status === 'in_progress' ? 'bg-blue-500' :
                    goal.status === 'at_risk' ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{goal.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={goal.priority === 'high' ? 'destructive' : goal.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                        {goal.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{goal.progress}% complete</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-4">No goals yet</p>
                <Button 
                  onClick={() => navigate("/goals")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Goal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines with Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DeadlineTimeline 
                goals={goals} 
                onGoalClick={() => navigate("/goals")}
              />
            )}

            {/* Quick Actions */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left"
                  onClick={() => navigate("/goals")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Goal
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left opacity-75"
                  onClick={() => navigate("/journal")}
                >
                  <Notebook className="w-4 h-4 mr-2" />
                  Write Journal Entry
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left opacity-75"
                  onClick={() => navigate("/training")}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Continue Training
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
  )
}