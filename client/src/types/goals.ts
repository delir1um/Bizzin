export type Goal = {
  id: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'at_risk'
  progress: number // 0-100
  progress_type: 'manual' | 'milestone' // Determines how progress is calculated
  target_value?: number
  current_value?: number
  unit?: string // Unit for target/current values (e.g., books, lbs, $)
  deadline: string // ISO date string
  created_at?: string
  updated_at?: string
  user_id: string
  priority: 'low' | 'medium' | 'high'
  category?: string
  reflection?: string
  milestones?: Milestone[] // Populated when fetching goal details
}

export type Milestone = {
  id: string
  goal_id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  due_date?: string // ISO date string
  weight: number // Default 1, used for weighted progress calculation
  order_index: number // For reordering milestones
  created_at?: string
  updated_at?: string
  user_id: string // For data integrity
}

export type GoalStats = {
  total: number
  completed: number
  inProgress: number
  successRate: number
}