import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, TrendingUp, Clock, CheckCircle, AlertTriangle, Play, Edit3, Trash2 } from "lucide-react"
import { Goal } from "@/types/goals"
import { format, differenceInDays, isAfter } from "date-fns"

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

  // Grid view - redesigned card layout
  return (
    <Card className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 ${priorityColors[goal.priority]} 
      hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/30
      hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer group
      hover:border-slate-300 dark:hover:border-slate-600
      relative overflow-hidden
      ${goal.status === 'completed' ? 'opacity-75' : ''}
    `}>
      {/* Subtle hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/30 to-transparent dark:from-slate-900/10 
        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Header with title and actions */}
      <div className="relative z-10 p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
              {goal.title}
            </h3>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(goal)}
                className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(goal)}
                className="h-8 w-8 p-0 opacity-60 hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Description */}
        {goal.description && (
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
            {goal.description}
          </p>
        )}
        
        {/* Meta info row */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Target Date: {format(deadline, 'MMM d, yyyy')}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={statusInfo.variant} className={`${statusInfo.className} text-xs`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
            {goal.category && (
              <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600">
                {goal.category}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress section */}
      <div className="relative z-10 px-6 pb-6">
        <div className="space-y-4">
          {/* Progress bar with better visual hierarchy */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
              <span className="text-lg font-semibold text-slate-900 dark:text-white">{getProgressText()}</span>
            </div>
            <Progress value={goal.progress} className="h-3 bg-slate-100 dark:bg-slate-700" />
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center justify-between text-sm">
            {timeStatus && (
              <div className={`flex items-center font-medium ${timeStatus.className}`}>
                <timeStatus.icon className="w-4 h-4 mr-2" />
                {timeStatus.text}
              </div>
            )}
            
            {goal.status === 'in_progress' && !isOverdue && daysRemaining > 7 && (
              <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
                <TrendingUp className="w-4 h-4 mr-2" />
                On track
              </div>
            )}
            
            {/* Priority indicator for high priority goals */}
            {goal.priority === 'high' && goal.status !== 'completed' && (
              <div className="flex items-center text-red-600 dark:text-red-400 font-medium">
                <AlertTriangle className="w-4 h-4 mr-2" />
                High Priority
              </div>
            )}
          </div>
          
          {/* Reflection section */}
          {goal.reflection && (
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Reflection & Learnings
              </h4>
              <blockquote className="border-l-3 border-slate-300 dark:border-slate-600 pl-4 italic text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {goal.reflection}
              </blockquote>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}