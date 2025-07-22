export type Goal = {
  id: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'at_risk'
  progress: number // 0-100
  target_value?: number
  current_value?: number
  deadline: string // ISO date string
  created_at?: string
  updated_at?: string
  user_id: string
  priority: 'low' | 'medium' | 'high'
  category?: string
}

export type GoalStats = {
  total: number
  completed: number
  inProgress: number
  successRate: number
}