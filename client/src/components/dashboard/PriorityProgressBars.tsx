import { Goal } from '@/types/goals'
import { Progress } from '@/components/ui/progress'

interface PriorityProgressBarsProps {
  goals: Goal[]
}

const PRIORITY_CONFIG = {
  high: {
    label: 'High Priority',
    color: 'bg-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300'
  },
  medium: {
    label: 'Medium Priority',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-300'
  },
  low: {
    label: 'Low Priority',
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    textColor: 'text-emerald-700 dark:text-emerald-300'
  }
}

export function PriorityProgressBars({ goals }: PriorityProgressBarsProps) {
  const getPriorityStats = (priority: 'high' | 'medium' | 'low') => {
    const priorityGoals = goals.filter(goal => goal.priority === priority)
    const total = priorityGoals.length
    const completed = priorityGoals.filter(goal => goal.status === 'completed').length
    const averageProgress = total > 0 
      ? Math.round(priorityGoals.reduce((sum, goal) => sum + goal.progress, 0) / total)
      : 0
    
    return { total, completed, averageProgress }
  }

  if (goals.length === 0) {
    return (
      <div className="space-y-4">
        {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
          <div key={priority} className={`p-4 rounded-lg ${config.bgColor}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${config.textColor}`}>
                {config.label}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">0 goals</span>
            </div>
            <Progress value={0} className="h-2" />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>0% average progress</span>
              <span>0/0 completed</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => {
        const stats = getPriorityStats(priority as 'high' | 'medium' | 'low')
        
        return (
          <div key={priority} className={`p-4 rounded-lg ${config.bgColor} transition-all hover:shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${config.textColor}`}>
                {config.label}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {stats.total} goal{stats.total !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="relative">
              <Progress 
                value={stats.averageProgress} 
                className="h-3"
              />
              <div 
                className={`absolute top-0 left-0 h-3 rounded-full ${config.color} transition-all duration-300`}
                style={{ width: `${stats.averageProgress}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>{stats.averageProgress}% average progress</span>
              <span>{stats.completed}/{stats.total} completed</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}