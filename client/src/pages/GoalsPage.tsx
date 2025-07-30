import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Target, Plus, TrendingUp, CheckCircle, Clock, AlertCircle, Filter, Search, SortAsc, SortDesc, Grid3X3, List, ChevronLeft, ChevronRight } from "lucide-react"
import { GoalCard } from "@/components/goals/GoalCard"
import { AddGoalModal } from "@/components/goals/AddGoalModal"
import { EditGoalModal } from "@/components/goals/EditGoalModal"
import { GoalsService } from "@/lib/services/goals"
import { useAuth } from "@/hooks/AuthProvider"
import { Goal } from "@/types/goals"
import { ConfettiCelebration, CelebrationToast } from "@/components/ConfettiCelebration"
import { StandardPageLayout, createStatCard } from "@/components/layout/StandardPageLayout"
import { AnimatedCard, AnimatedGrid, AnimatedItem } from "@/components/ui/animated-card"
import { motion, AnimatePresence } from "framer-motion"

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
  
  // Enhanced UI controls for scalability
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<'title' | 'priority' | 'dueDate' | 'created'>('created')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12) // Show 12 goals per page

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
  
  // Filter, search, and sort goals
  const processedGoals = goals
    .filter((goal: Goal) => {
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
      
      // Search filter
      let searchMatches = true
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        searchMatches = goal.title.toLowerCase().includes(query) ||
                       goal.description?.toLowerCase().includes(query) ||
                       false
      }
      
      return statusMatches && priorityMatches && searchMatches
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority]
          break
        case 'dueDate':
          if (!a.deadline && !b.deadline) comparison = 0
          else if (!a.deadline) comparison = 1
          else if (!b.deadline) comparison = -1
          else comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          break
        case 'created':
        default:
          const aDate = a.created_at || new Date().toISOString()
          const bDate = b.created_at || new Date().toISOString()
          comparison = new Date(bDate).getTime() - new Date(aDate).getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Pagination
  const totalPages = Math.ceil(processedGoals.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedGoals = processedGoals.slice(startIndex, startIndex + itemsPerPage)
  
  // Reset page when filters change
  const filteredGoals = processedGoals // For backward compatibility

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
      queryClient.invalidateQueries({ queryKey: ['usage-status'] })
      
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
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </div>
        </div>
      </div>

      {/* Goal Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500 rounded-lg shadow-sm">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.total}</div>
                )}
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.completed}</div>
                )}
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.inProgress}</div>
                )}
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg shadow-sm">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{Math.round(stats.successRate)}%</div>
                )}
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search goals by title or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Reset to first page on search
              }}
              className="pl-10"
            />
          </div>
          
          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Date Created</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="dueDate">Due Date</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="shrink-0"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="shrink-0"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Filter Options */}
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
                    onClick={() => {
                      setStatusFilter(option.value)
                      setCurrentPage(1) // Reset to first page on filter change
                    }}
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
                    onClick={() => {
                      setPriorityFilter(option.value)
                      setCurrentPage(1) // Reset to first page on filter change
                    }}
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
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Results Info */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, processedGoals.length)} of {processedGoals.length} goals
              {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all') && 
                ` (filtered from ${goals.length} total)`}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Page {currentPage} of {Math.max(1, totalPages)}
            </p>
          </div>

          {/* Goals Grid/List */}
          <AnimatedGrid 
            className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8"
                : "space-y-4 mb-8"
            }
            stagger={0.1}
          >
            {paginatedGoals.map((goal: Goal, index) => (
              <AnimatedItem key={goal.id}>
                <GoalCard 
                key={goal.id} 
                goal={goal} 
                onEdit={handleEditGoal} 
                onDelete={handleDeleteGoal}
                viewMode={viewMode}
              />
              </AnimatedItem>
            ))}
          </AnimatedGrid>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
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