import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, TrendingUp, Clock, CheckCircle, AlertTriangle, Play, Edit3 } from "lucide-react"
import { Goal } from "@/types/goals"
import { format, differenceInDays, isAfter } from "date-fns"

type GoalCardProps = {
  goal: Goal
  onEdit?: (goal: Goal) => void
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
    className: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
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

export function GoalCard({ goal, onEdit }: GoalCardProps) {
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

  return (
    <Card className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 ${priorityColors[goal.priority]} ${
      goal.status === 'completed' ? 'opacity-75' : ''
    }`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl text-slate-900 dark:text-white">
              {goal.title}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">
              {goal.description}
            </CardDescription>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Target Date: {format(deadline, 'MMM d, yyyy')}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(goal)}
                  className="h-8 w-8 p-0"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
              <Badge variant={statusInfo.variant} className={statusInfo.className}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
            {goal.category && (
              <Badge variant="outline" className="text-xs">
                {goal.category}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">{getProgressText()}</span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>
          <div className="flex items-center space-x-4 text-sm">
            {timeStatus && (
              <div className={`flex items-center ${timeStatus.className}`}>
                <timeStatus.icon className="w-4 h-4 mr-1" />
                {timeStatus.text}
              </div>
            )}
            {goal.status === 'in_progress' && !isOverdue && daysRemaining > 7 && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                On track
              </div>
            )}
            {goal.priority === 'high' && goal.status !== 'completed' && (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 mr-1" />
                High Priority
              </div>
            )}
          </div>
          
          {goal.reflection && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Reflection & Learnings
              </h4>
              <blockquote className="border-l-2 border-slate-300 dark:border-slate-600 pl-4 italic text-sm text-slate-600 dark:text-slate-400">
                {goal.reflection}
              </blockquote>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}