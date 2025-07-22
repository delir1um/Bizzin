import { supabase } from '@/lib/supabase'
import { Goal, GoalStats } from '@/types/goals'

export class GoalsService {
  static async getUserGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching goals:', error)
      throw new Error(`Failed to fetch goals: ${error.message}`)
    }

    return data || []
  }

  static async createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    // Remove fields that might not exist in database yet
    const { reflection, ...goalData } = goal

    const { data, error } = await supabase
      .from('goals')
      .insert([goalData])
      .select()
      .single()

    if (error) {
      console.error('Error creating goal:', error)
      throw new Error(`Failed to create goal: ${error.message}`)
    }

    return data
  }

  static async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    // Remove fields that shouldn't be updated or might cause errors
    const { updated_at, created_at, id, reflection, ...updateData } = updates

    const { data, error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', goalId)
      .select()
      .single()

    if (error) {
      console.error('Error updating goal:', error)
      throw new Error(`Failed to update goal: ${error.message}`)
    }

    return data
  }

  static async deleteGoal(goalId: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)

    if (error) {
      console.error('Error deleting goal:', error)
      throw new Error(`Failed to delete goal: ${error.message}`)
    }
  }

  static calculateStats(goals: Goal[]): GoalStats {
    const total = goals.length
    const completed = goals.filter(goal => goal.status === 'completed').length
    const inProgress = goals.filter(goal => goal.status === 'in_progress').length
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      completed,
      inProgress,
      successRate
    }
  }
}