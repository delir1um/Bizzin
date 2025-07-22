import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Target, Plus, TrendingUp, CheckCircle, Clock, AlertCircle, Filter } from "lucide-react"
import { GoalCard } from "@/components/goals/GoalCard"
import { AddGoalModal } from "@/components/goals/AddGoalModal"
import { EditGoalModal } from "@/components/goals/EditGoalModal"
import { GoalsService } from "@/lib/services/goals"
import { useAuth } from "@/hooks/AuthProvider"
import { Goal } from "@/types/goals"
import { ConfettiCelebration, CelebrationToast } from "@/components/ConfettiCelebration"

type FilterStatus = 'all' | 'active' | 'completed' | 'at_risk'
type FilterPriority = 'all' | 'high' | 'medium' | 'low'

export function GoalsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all')
  const [addGoalModalOpen, setAddGoalModalOpen] = useState(false)
  const [editGoalModalOpen, setEditGoalModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null)
  const [celebrationTrigger, setCelebrationTrigger] = useState(false)
  const [celebrationToastVisible, setCelebrationToastVisible] = useState(false)
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null)

  // Fetch goals data
  const {
    data: goals = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => user ? GoalsService.getUserGoals(user.id) : Promise.resolve([]),
    enabled: !!user
  })

  // Calculate statistics
  const stats = GoalsService.calculateStats(goals)
  
  // Filter goals based on status and priority
  const filteredGoals = goals.filter((goal: Goal) => {
    // Status filter
    let statusMatches = true
    switch (statusFilter) {
      case 'active':
        statusMatches = ['in_progress', 'not_started'].includes(goal.status)
        break
      case 'completed':
        statusMatches = goal.status === 'completed'
        break
      case 'at_risk':
        statusMatches = goal.status === 'at_risk'
        break
      default:
        statusMatches = true
    }
    
    // Priority filter
    let priorityMatches = true
    if (priorityFilter !== 'all') {
      priorityMatches = goal.priority === priorityFilter
    }
    
    return statusMatches && priorityMatches
  })

  const statusFilterOptions = [
    { value: 'all' as const, label: 'All Goals', count: goals.length },
    { value: 'active' as const, label: 'Active', count: stats.inProgress + goals.filter((g: Goal) => g.status === 'not_started').length },
    { value: 'completed' as const, label: 'Completed', count: stats.completed },
    { value: 'at_risk' as const, label: 'At Risk', count: goals.filter((g: Goal) => g.status === 'at_risk').length },
  ]

  const priorityFilterOptions = [
    { value: 'all' as const, label: 'All Priorities', count: goals.length },
    { value: 'high' as const, label: 'High', count: goals.filter((g: Goal) => g.priority === 'high').length },
    { value: 'medium' as const, label: 'Medium', count: goals.filter((g: Goal) => g.priority === 'medium').length },
    { value: 'low' as const, label: 'Low', count: goals.filter((g: Goal) => g.priority === 'low').length },
  ]

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal)
    setEditGoalModalOpen(true)
  }

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => GoalsService.deleteGoal(goalId),
    onSuccess: () => {
      // Invalidate and refetch goals
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] })
      
      // Show success message
      toast({
        title: "Goal deleted successfully",
        description: "The goal has been removed from your list.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete goal",
        description: error.message || "Please try again later.",
        variant: "destructive",
      })
    },
  })

  const handleDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteGoal = () => {
    if (goalToDelete) {
      deleteGoalMutation.mutate(goalToDelete.id)
      setDeleteDialogOpen(false)
      setGoalToDelete(null)
    }
  }

  const handleGoalCompleted = (goal: Goal) => {
    setCompletedGoal(goal)
    setCelebrationTrigger(true)
    setCelebrationToastVisible(true)
    
    // Reset celebration trigger after animation
    setTimeout(() => {
      setCelebrationTrigger(false)
    }, 100)
  }

  const handleCelebrationComplete = () => {
    setCelebrationToastVisible(false)
    setCompletedGoal(null)
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to view your goals.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Business Goals</h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
              Set, track, and achieve your business objectives
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button 
              onClick={() => setAddGoalModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </div>
        </div>
      </div>

      {/* Goal Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                {isLoading ? (
                  <Skeleton className="h-6 w-8 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                {isLoading ? (
                  <Skeleton className="h-6 w-8 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completed}</p>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                {isLoading ? (
                  <Skeleton className="h-6 w-8 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.inProgress}</p>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-400">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                {isLoading ? (
                  <Skeleton className="h-6 w-8 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.successRate}%</p>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-400">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Options */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Filter Label */}
          <div className="flex items-center flex-shrink-0">
            <Filter className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters:</span>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4 flex-1">
            {/* Status Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-shrink-0">Status:</span>
              <div className="flex flex-wrap gap-2">
                {statusFilterOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant={statusFilter === option.value ? "default" : "secondary"}
                    className={`cursor-pointer transition-colors ${
                      statusFilter === option.value
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                    onClick={() => setStatusFilter(option.value)}
                  >
                    {option.label} ({option.count})
                  </Badge>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-shrink-0">Priority:</span>
              <div className="flex flex-wrap gap-2">
                {priorityFilterOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant={priorityFilter === option.value ? "default" : "secondary"}
                    className={`cursor-pointer transition-colors ${
                      priorityFilter === option.value
                        ? "bg-orange-600 hover:bg-orange-700 text-white"
                        : "hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                    onClick={() => setPriorityFilter(option.value)}
                  >
                    {option.label} ({option.count})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load goals. {error instanceof Error ? error.message : 'Please try again later.'}
            <Button variant="link" onClick={() => refetch()} className="ml-2 h-auto p-0">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Goals List */}
      {isLoading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white dark:bg-slate-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGoals.length === 0 ? (
        // Empty State
        <div className="text-center py-12">
          <Card className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-slate-800 dark:to-slate-700 border border-blue-200 dark:border-slate-600">
            <CardContent className="p-8">
              <Target className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {statusFilter === 'all' && priorityFilter === 'all'
                  ? "No goals yet" 
                  : `No ${statusFilter !== 'all' ? statusFilter + ' ' : ''}${priorityFilter !== 'all' ? priorityFilter + ' priority ' : ''}goals`
                }
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                {statusFilter === 'all' && priorityFilter === 'all'
                  ? "Define clear objectives and track your progress toward business success." 
                  : `You don't have any goals matching the selected filters at the moment.`
                }
              </p>
              <Button 
                onClick={() => setAddGoalModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGoals.map((goal: Goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={handleEditGoal} onDelete={handleDeleteGoal} />
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      <AddGoalModal 
        open={addGoalModalOpen} 
        onOpenChange={setAddGoalModalOpen}
      />

      {/* Edit Goal Modal */}
      <EditGoalModal 
        open={editGoalModalOpen} 
        onOpenChange={setEditGoalModalOpen}
        goal={selectedGoal}
        onGoalCompleted={handleGoalCompleted}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{goalToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteGoal}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteGoalMutation.isPending}
            >
              {deleteGoalMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Celebration Components */}
      <ConfettiCelebration trigger={celebrationTrigger} />
      <CelebrationToast 
        show={celebrationToastVisible}
        goalTitle={completedGoal?.title || ""}
        onComplete={handleCelebrationComplete}
      />
    </div>
  )
}