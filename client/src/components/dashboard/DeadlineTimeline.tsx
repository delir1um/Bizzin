import { Goal } from '@/types/goals'
import { Badge } from '@/components/ui/badge'
import { format, differenceInDays, isAfter, isSameDay } from 'date-fns'
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react'

interface DeadlineTimelineProps {
  goals: Goal[]
  onGoalClick?: () => void
}

export function DeadlineTimeline({ goals, onGoalClick }: DeadlineTimelineProps) {
  const activeGoals = goals
    .filter(goal => goal.status !== 'completed' && goal.deadline)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5) // Show top 5 upcoming deadlines

  if (activeGoals.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
        <p className="text-xs text-muted-foreground">All caught up!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activeGoals.map((goal, index) => {
        const deadline = new Date(goal.deadline)
        const today = new Date()
        const daysUntilDeadline = differenceInDays(deadline, today)
        const isOverdue = isAfter(today, deadline)
        const isToday = isSameDay(deadline, today)
        const isUrgent = daysUntilDeadline <= 3 && daysUntilDeadline >= 0

        // Timeline dot color based on urgency
        const getDotColor = () => {
          if (isOverdue) return 'bg-red-500 ring-red-200'
          if (isToday) return 'bg-orange-500 ring-orange-200'
          if (isUrgent) return 'bg-amber-500 ring-amber-200'
          return 'bg-orange-500 ring-orange-200'
        }

        // Timeline line color
        const getLineColor = () => {
          if (isOverdue) return 'border-red-200'
          if (isUrgent) return 'border-amber-200'
          return 'border-slate-200 dark:border-slate-700'
        }

        return (
          <div key={goal.id} className="relative">
            {/* Timeline dot and line */}
            <div className="flex items-start">
              <div className="relative flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full ring-4 ${getDotColor()}`} />
                {index < activeGoals.length - 1 && (
                  <div className={`absolute top-3 left-1/2 w-0.5 h-8 -translate-x-1/2 border-l-2 ${getLineColor()}`} />
                )}
              </div>

              {/* Goal content */}
              <div 
                className="ml-4 flex-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-3 rounded-lg transition-colors"
                onClick={onGoalClick}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {goal.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={goal.priority === 'high' ? 'destructive' : goal.priority === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {goal.priority}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {goal.progress}% complete
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Due {format(deadline, 'MMM d, yyyy')}
                    </p>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-1">
                    {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    {isToday && <Clock className="w-4 h-4 text-orange-500" />}
                    <Badge 
                      variant={isOverdue ? 'destructive' : isToday ? 'default' : isUrgent ? 'default' : 'secondary'}
                      className="text-xs whitespace-nowrap"
                    >
                      {isOverdue ? `${Math.abs(daysUntilDeadline)}d overdue` :
                       isToday ? 'Today' :
                       daysUntilDeadline === 1 ? 'Tomorrow' :
                       `${daysUntilDeadline}d left`}
                    </Badge>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        goal.progress >= 80 ? 'bg-green-500' :
                        goal.progress >= 50 ? 'bg-orange-500' :
                        goal.progress >= 25 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}