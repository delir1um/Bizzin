import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Goal } from '@/types/goals'

interface ProgressDonutChartProps {
  goals: Goal[]
}

export function ProgressDonutChart({ goals }: ProgressDonutChartProps) {
  const data = [
    {
      name: 'Completed',
      value: goals.filter(goal => goal.status === 'completed').length,
      color: '#10B981'
    },
    {
      name: 'In Progress',
      value: goals.filter(goal => goal.status === 'in_progress').length,
      color: '#EA7A57'
    },
    {
      name: 'Not Started',
      value: goals.filter(goal => goal.status === 'not_started').length,
      color: '#6B7280'
    },
    {
      name: 'On Hold',
      value: goals.filter(goal => goal.status === 'on_hold').length,
      color: '#F59E0B'
    }
  ].filter(item => item.value > 0)

  const total = goals.length
  const completed = goals.filter(goal => goal.status === 'completed').length
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-medium text-slate-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {data.value} goal{data.value !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {total > 0 ? Math.round((data.value / total) * 100) : 0}% of total
          </p>
        </div>
      )
    }
    return null
  }

  if (goals.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 dark:text-slate-400">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          </div>
          <p className="text-sm">No goals yet</p>
          <p className="text-xs">Create your first goal to see progress</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text showing success rate */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {successRate}%
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Success Rate
          </div>
        </div>
      </div>
    </div>
  )
}