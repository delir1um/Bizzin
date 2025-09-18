import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, TrendingUp, Clock, CheckCircle, AlertTriangle, Play, Edit3, Trash2, Target, Eye } from "lucide-react"
import { Goal } from "@/types/goals"
import { format, differenceInDays, isAfter } from "date-fns"
import { cn } from "@/lib/utils"

type GoalCardProps = {
  goal: Goal
  onEdit?: (goal: Goal) => void
  onDelete?: (goal: Goal) => void
  onViewDetails?: (goal: Goal) => void
  viewMode?: 'grid' | 'list'
  className?: string
}

const statusConfig = {
  not_started: {
    variant: "secondary" as const,
    className: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
    icon: Play,
    label: "Not Started"
  },
  in_progress: {
    variant: "secondary" as const,
    className: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
    icon: Clock,
    label: "In Progress"
  },
  completed: {
    variant: "secondary" as const,
    className: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    icon: CheckCircle,
    label: "Completed"
  },
  at_risk: {
    variant: "secondary" as const,
    className: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
    icon: AlertTriangle,
    label: "At Risk"
  },
  on_hold: {
    variant: "secondary" as const,
    className: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
    icon: Clock,
    label: "On Hold"
  }
}

const priorityColors = {
  low: "border-l-green-500",
  medium: "border-l-yellow-500",
  high: "border-l-red-500"
}

export function GoalCard({ goal, onEdit, onDelete, onViewDetails, viewMode = 'grid', className }: GoalCardProps) {
  const statusInfo = statusConfig[goal.status]
  const StatusIcon = statusInfo.icon
  const deadline = new Date(goal.deadline)
  const daysRemaining = differenceInDays(deadline, new Date())
  const isOverdue = isAfter(new Date(), deadline) && goal.status !== 'completed'

  const calculateMilestoneProgress = () => {
    if (!goal.milestones || goal.milestones.length === 0) {
      return 0
    }
    
    const totalWeight = goal.milestones.reduce((sum, milestone) => sum + (milestone.weight || 0), 0)
    if (totalWeight === 0) return 0
    
    const completedWeight = goal.milestones
      .filter(milestone => milestone.status === 'done')
      .reduce((sum, milestone) => sum + (milestone.weight || 0), 0)
    
    // Normalize progress based on current total weight (handles partial milestone setups)
    const normalizedProgress = Math.round((completedWeight / totalWeight) * 100)
    
    // If milestones don't total 100%, show proportional progress
    if (totalWeight < 100) {
      return Math.round((normalizedProgress * totalWeight) / 100)
    }
    
    return normalizedProgress
  }

  const getActualProgress = () => {
    if (goal.progress_type === 'milestone') {
      return calculateMilestoneProgress()
    }
    return goal.progress || 0
  }

  const getProgressText = () => {
    const actualProgress = getActualProgress()
    
    if (goal.target_value && goal.current_value) {
      return `${goal.current_value.toLocaleString()} / ${goal.target_value.toLocaleString()}`
    }
    return `${actualProgress}%`
  }

  const getTimeStatus = () => {
    if (goal.status === 'completed') {
      return {
        text: `Completed on ${format(new Date(goal.updated_at || goal.deadline), 'MMM d, yyyy')}`,
        icon: CheckCircle,
        className: "text-green-600 dark:text-green-400"
      }
    }
    
    if (isOverdue) {
      return {
        text: `${Math.abs(daysRemaining)} days overdue`,
        icon: AlertTriangle,
        className: "text-red-600 dark:text-red-400"
      }
    }
    
    if (daysRemaining === 0) {
      return {
        text: "Due today",
        icon: Clock,
        className: "text-yellow-600 dark:text-yellow-400"
      }
    }
    
    if (daysRemaining > 0) {
      return {
        text: `${daysRemaining} days remaining`,
        icon: Calendar,
        className: "text-slate-600 dark:text-slate-400"
      }
    }
  }

  const timeStatus = getTimeStatus()

  // List view - more compact horizontal layout
  if (viewMode === 'list') {
    return (
      <Card 
        className={cn(
          `bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 ${priorityColors[goal.priority]} cursor-pointer hover:shadow-md transition-shadow`,
          goal.status === 'completed' && 'opacity-75',
          className
        )}
        onClick={() => onEdit?.(goal)}
        data-testid="card-goal"
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Left side - Goal info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <StatusIcon className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                    {goal.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {goal.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Center - Progress and status */}
            <div className="flex items-center space-x-6 px-6">
              <div className="text-center">
                <Badge className={statusInfo.className}>
                  {statusInfo.label}
                </Badge>
              </div>
              
              <div className="w-32">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Progress</span>
                  <span className="text-xs font-medium text-slate-900 dark:text-white">
                    {getProgressText()}
                  </span>
                </div>
                <Progress value={getActualProgress()} className="h-2" />
              </div>

              <div className="text-center min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                  {goal.priority} Priority
                </div>
                {timeStatus && (
                  <div className={`text-xs ${timeStatus.className} flex items-center justify-center mt-1`}>
                    <timeStatus.icon className="w-3 h-3 mr-1" />
                    {timeStatus.text}
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {onViewDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewDetails(goal)
                  }}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  data-testid="button-view-details"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(goal)
                  }}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  data-testid="button-delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view - modern card layout
  return (
    <Card 
      className={cn(
        `bg-white dark:bg-slate-800 border-0 shadow-sm hover:shadow-lg 
        transition-all duration-300 ease-out cursor-pointer group
        relative overflow-hidden rounded-xl h-full flex flex-col`,
        goal.status === 'completed' && 'opacity-75',
        className
      )}
      onClick={() => onEdit?.(goal)}
      data-testid="card-goal"
    >
      {/* Priority indicator stripe */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        goal.priority === 'high' ? 'bg-red-500' : 
        goal.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
      }`} />
      
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
              {goal.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails(goal)
                }}
                className="h-9 w-9 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                data-testid="button-view-details"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(goal)
                }}
                className="h-9 w-9 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                data-testid="button-delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Content Section - Flexible area */}
        <div className="flex-1 flex flex-col space-y-4">
          {/* Description */}
          {goal.description && (
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">
              {goal.description}
            </p>
          )}
          
          {/* On Track Status - Prominent placement */}
          {goal.status === 'in_progress' && !isOverdue && daysRemaining > 7 && (
            <div>
              <div className="inline-flex items-center px-3 py-2 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <TrendingUp className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">On track</span>
              </div>
            </div>
          )}
          
          {/* Progress Section */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{getProgressText()}</span>
            </div>
            <div className="relative">
              <Progress value={getActualProgress()} className="h-2 bg-slate-100 dark:bg-slate-700" />
              {/* Milestone Indicators - Option 2 Implementation */}
              {goal.progress_type === 'milestone' && goal.milestones && goal.milestones.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between relative h-1">
                    {(() => {
                      let cumulativeWeight = 0
                      return goal.milestones.map((milestone, index) => {
                        const position = cumulativeWeight
                        cumulativeWeight += milestone.weight || 0
                        const isCompleted = milestone.status === 'done'
                        return (
                          <div
                            key={milestone.id}
                            className={`absolute w-2 h-2 rounded-full border-2 transform -translate-x-1 -translate-y-0.5 transition-colors duration-200 ${
                              isCompleted 
                                ? 'bg-green-500 border-green-600 dark:bg-green-400 dark:border-green-500' 
                                : 'bg-slate-300 border-slate-400 dark:bg-slate-600 dark:border-slate-500'
                            }`}
                            style={{ 
                              left: `${Math.min(position, 98)}%`,
                              zIndex: 10 
                            }}
                            title={`${milestone.title} (${milestone.weight}%) - ${isCompleted ? 'Completed' : 'Pending'}`}
                          />
                        )
                      })
                    })()}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>{goal.milestones.filter(m => m.status === 'done').length} of {goal.milestones.length} milestones completed</span>
                    <span>Total: {goal.milestones.reduce((sum, m) => sum + (m.weight || 0), 0)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Milestone Preview Section - Compact */}
        {goal.progress_type === 'milestone' && goal.milestones && goal.milestones.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Target className="w-3 h-3 mr-1.5 text-orange-600" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Milestones ({goal.milestones.filter(m => m.status === 'done').length}/{goal.milestones.length})
                </span>
              </div>
              {onViewDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewDetails(goal)
                  }}
                  className="text-xs text-orange-600 hover:text-orange-700 p-0.5 h-auto"
                  data-testid="button-view-milestones"
                >
                  View All
                </Button>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              {goal.milestones.slice(0, 2).map((milestone, index) => (
                <div key={milestone.id} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    milestone.status === 'done' 
                      ? 'bg-green-500' 
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`} />
                  <span className={cn(
                    "truncate flex-1",
                    milestone.status === 'done' && 'line-through'
                  )}>
                    {milestone.title}
                  </span>
                </div>
              ))}
              {goal.milestones.length > 2 && (
                <div className="text-slate-400 dark:text-slate-500 pl-3.5 text-xs">
                  +{goal.milestones.length - 2} more
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Bottom section - Always at bottom */}
        <div className="mt-auto pt-4 space-y-3">
          {/* Target date and time status */}
          <div className="flex items-center justify-between text-xs">
            <div className="text-slate-500 dark:text-slate-400">
              Target: {format(deadline, 'MMM d, yyyy')}
            </div>
            {timeStatus && (
              <div className={`flex items-center font-medium ${timeStatus.className}`}>
                <timeStatus.icon className="w-3 h-3 mr-1" />
                {timeStatus.text}
              </div>
            )}
          </div>
          
          {/* Status and category badges */}
          <div className="flex items-center justify-between">
            <Badge variant={statusInfo.variant} className={`${statusInfo.className} text-xs font-medium px-2.5 py-1`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
            {goal.category && (
              <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-2.5 py-1">
                {goal.category}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}