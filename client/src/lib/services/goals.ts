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
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Remove fields that might not exist in database yet and ensure user_id
      const { reflection, ...goalData } = goal
      const goalWithUserId = {
        ...goalData,
        user_id: user.id  // Use authenticated user's ID
      }

      console.log('Creating goal with authenticated user:', user.id)

      const { data, error } = await supabase
        .from('goals')
        .insert([goalWithUserId])
        .select()
        .single()

      if (error) {
        console.error('Error creating goal:', error)
        throw new Error(`Failed to create goal: ${error.message}`)
      }

      return data
    } catch (err) {
      console.error('Error in createGoal:', err)
      throw err
    }
  }

  static async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    try {
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('Updating goal:', goalId, 'for user:', user.id)

      // Remove fields that shouldn't be updated or might cause errors
      const { updated_at, created_at, id, user_id, reflection, ...updateData } = updates

      // Also remove any undefined fields
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      )

      console.log('Cleaned update data:', cleanUpdateData)

      // Update goal with user authentication - RLS will ensure user can only update their own goals
      const { data, error } = await supabase
        .from('goals')
        .update(cleanUpdateData)
        .eq('id', goalId)
        .eq('user_id', user.id)  // Ensure user can only update their own goals
        .select()
        .single()

      if (error) {
        console.error('Supabase error updating goal:', error)
        if (error.code === 'PGRST116') {
          throw new Error('Goal not found or you do not have permission to update it.')
        }
        throw new Error(`Failed to update goal: ${error.message}`)
      }

      if (!data) {
        throw new Error('Goal not found or you do not have permission to update it.')
      }

      console.log('Goal updated successfully:', data)
      return data
    } catch (err) {
      console.error('Error updating goal:', err)
      if (err instanceof Error) {
        // Check if it's a network error
        if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
          throw new Error('Network connection error. Please check your internet connection and try again.')
        }
        throw err
      }
      throw new Error('An unexpected error occurred while updating the goal.')
    }
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