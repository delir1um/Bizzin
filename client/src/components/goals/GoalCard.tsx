import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Calendar, TrendingUp, Clock, CheckCircle, AlertTriangle, Play, Edit3, Trash2, ChevronDown, ChevronRight, Target } from "lucide-react"
import { Goal } from "@/types/goals"
import { format, differenceInDays, isAfter } from "date-fns"
import { MilestoneList } from "./MilestoneList"
import { cn } from "@/lib/utils"

type GoalCardProps = {
  goal: Goal
  onEdit?: (goal: Goal) => void
  onDelete?: (goal: Goal) => void
  viewMode?: 'grid' | 'list'
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

export function GoalCard({ goal, onEdit, onDelete, viewMode = 'grid' }: GoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const statusInfo = statusConfig[goal.status]
  const StatusIcon = statusInfo.icon
  const deadline = new Date(goal.deadline)
  const daysRemaining = differenceInDays(deadline, new Date())
  const isOverdue = isAfter(new Date(), deadline) && goal.status !== 'completed'

  const getProgressText = () => {
    if (goal.target_value && goal.current_value) {
      return `${goal.current_value.toLocaleString()} / ${goal.target_value.toLocaleString()}`
    }
    return `${goal.progress}%`
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
      <Card className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 ${priorityColors[goal.priority]} ${
        goal.status === 'completed' ? 'opacity-75' : ''
      }`}>
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
                <Progress value={goal.progress} className="h-2" />
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
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(goal)}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(goal)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
    <Card className={`bg-white dark:bg-slate-800 border-0 shadow-sm hover:shadow-lg 
      transition-all duration-300 ease-out cursor-pointer group
      relative overflow-hidden rounded-xl
      ${goal.status === 'completed' ? 'opacity-75' : ''}
    `}>
      {/* Priority indicator stripe */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        goal.priority === 'high' ? 'bg-red-500' : 
        goal.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
      }`} />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
              {goal.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(goal)}
                className="h-9 w-9 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(goal)}
                className="h-9 w-9 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Description */}
        {goal.description && (
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3">
            {goal.description}
          </p>
        )}
        
        {/* On Track Status - Prominent placement */}
        {goal.status === 'in_progress' && !isOverdue && daysRemaining > 7 && (
          <div className="mb-4">
            <div className="inline-flex items-center px-3 py-2 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <TrendingUp className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">On track</span>
            </div>
          </div>
        )}
        
        {/* Progress Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{getProgressText()}</span>
          </div>
          <Progress value={goal.progress} className="h-2 bg-slate-100 dark:bg-slate-700" />
        </div>
        
        {/* Bottom section with reorganized layout */}
        <div className="space-y-3">
          {/* Top row: Target date and days remaining */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-slate-500 dark:text-slate-400">
              Target: {format(deadline, 'MMM d, yyyy')}
            </div>
            {timeStatus && (
              <div className={`flex items-center font-medium ${timeStatus.className}`}>
                <timeStatus.icon className="w-4 h-4 mr-2" />
                {timeStatus.text}
              </div>
            )}
          </div>
          
          {/* Bottom row: Status and category badges with better spacing */}
          <div className="flex items-center justify-between">
            <Badge variant={statusInfo.variant} className={`${statusInfo.className} text-xs font-medium px-3 py-1.5`}>
              <StatusIcon className="w-3 h-3 mr-1.5" />
              {statusInfo.label}
            </Badge>
            {goal.category && (
              <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-1.5">
                {goal.category}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Milestone section - Phase 1 Implementation */}
        {goal.progress_type === 'milestone' && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto text-left"
                >
                  <div className="flex items-center">
                    <Target className="w-4 h-4 mr-2 text-orange-600" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Milestones ({goal.milestones?.filter(m => m.status === 'done').length || 0}/{goal.milestones?.length || 0})
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <MilestoneList
                  goalId={goal.id}
                  milestones={goal.milestones || []}
                  onMilestoneUpdate={() => {
                    // Refresh goal data after milestone updates
                    // This will be handled by React Query invalidation
                  }}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Reflection section */}
        {goal.reflection && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Reflection
            </h4>
            <blockquote className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-sm text-slate-600 dark:text-slate-400 italic line-clamp-3">
              {goal.reflection}
            </blockquote>
          </div>
        )}
      </div>
    </Card>
  )
}