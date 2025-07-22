import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Goal } from '@/types/goals'

interface CategoryChartProps {
  goals: Goal[]
}

const CATEGORY_COLORS = [
  '#EA7A57', // Orange (primary brand color)
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6366F1', // Indigo
]

export function CategoryChart({ goals }: CategoryChartProps) {
  // Group goals by category
  const categoryData = goals.reduce((acc, goal) => {
    const category = goal.category || 'Uncategorized'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const data = Object.entries(categoryData)
    .map(([name, value], index) => ({
      name,
      value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    }))
    .sort((a, b) => b.value - a.value) // Sort by count descending

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage = goals.length > 0 ? Math.round((data.value / goals.length) * 100) : 0
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-medium text-slate-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {data.value} goal{data.value !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {percentage}% of total
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1 text-xs">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600 dark:text-slate-300 truncate max-w-20">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 dark:text-slate-400">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-1">
              <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700"></div>
              <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700"></div>
              <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700"></div>
              <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700"></div>
            </div>
          </div>
          <p className="text-sm">No categories yet</p>
          <p className="text-xs">Create goals to see distribution</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            outerRadius={60}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}