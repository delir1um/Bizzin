import { supabase } from '@/lib/supabase'
import { Goal, GoalStats, Milestone } from '@/types/goals'
import { MilestonesService } from './milestones'
import { goalLogger } from '@/lib/logger'

export class GoalsService {
  static async getUserGoals(userId: string): Promise<Goal[]> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        goalLogger.logError('FETCH_GOALS', error, undefined, userId, 'Failed to fetch user goals')
        throw new Error(`Failed to fetch goals: ${error.message}`)
      }

      console.log(`[GOALS_FETCH] Retrieved ${data?.length || 0} goals for user ${userId}`)
      return data || []
    } catch (error) {
      goalLogger.logError('FETCH_GOALS', error, undefined, userId, 'Exception in getUserGoals')
      throw error
    }
  }

  static async getGoalWithMilestones(goalId: string): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single()

    if (error) {
      console.error('Error fetching goal:', error)
      throw new Error(`Failed to fetch goal: ${error.message}`)
    }

    // Default progress_type to 'manual' if column doesn't exist yet
    if (!data.progress_type) {
      data.progress_type = 'manual'
    }

    // Fetch milestones if the goal uses milestone-based progress
    if (data.progress_type === 'milestone' || data.description?.includes('[MILESTONE_BASED]')) {
      const milestones = await MilestonesService.getMilestonesByGoalId(goalId)
      data.milestones = milestones
    }

    return data
  }

  static async updateGoalProgress(goalId: string): Promise<Goal> {
    try {
      // Get the goal and its milestones
      const goal = await this.getGoalWithMilestones(goalId)
      
      if (goal.progress_type === 'milestone' && goal.milestones) {
        // Check if any milestone has a weight > 1 to determine if weighted calculation should be used
        const useWeighted = goal.milestones.some(m => m.weight > 1)
        
        // Calculate progress from milestones using appropriate method
        const newProgress = MilestonesService.calculateMilestoneProgress(goal.milestones, useWeighted)
        
        // Update goal progress
        const updatedGoal = await this.updateGoal(goalId, { progress: newProgress })
        return updatedGoal
      }
      
      return goal
    } catch (err) {
      console.error('Error updating goal progress:', err)
      throw err
    }
  }

  static async createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    let userId: string | undefined
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }
      userId = user.id

      // Log the creation attempt
      goalLogger.logCreate(goal, userId, 'Starting goal creation')

      // Remove fields that might not exist in database yet and ensure user_id
      const { reflection, current_value, target_value, unit, ...goalData } = goal
      
      console.log('Goal creation requested with progress_type:', goal.progress_type)
      
      // Include progress_type in goal data
      if (goal.progress_type) {
        goalData.progress_type = goal.progress_type
      }
      
      // Auto-calculate progress if current_value and target_value were provided
      if (current_value !== undefined && target_value !== undefined) {
        if (target_value > 0) {
          // Standard "higher is better" calculation
          const calculatedProgress = Math.min(100, Math.max(0, (current_value / target_value) * 100))
          goalData.progress = Math.round(calculatedProgress)
          console.log(`Auto-calculated progress: ${current_value}/${target_value} = ${goalData.progress}%`)
          goalLogger.logCreate({ ...goalData, progress: calculatedProgress }, userId, 'Auto-calculated progress')
        }
      }
      
      const goalWithUserId = {
        ...goalData,
        user_id: user.id  // Use authenticated user's ID
      }

      console.log('Creating goal with authenticated user:', user.id)
      goalLogger.logCreate(goalWithUserId, userId, 'About to insert into database')

      const { data, error } = await supabase
        .from('goals')
        .insert([goalWithUserId])
        .select()
        .single()

      if (error) {
        goalLogger.logError('CREATE_GOAL', error, undefined, userId, 'Database insert failed')
        throw new Error(`Failed to create goal: ${error.message}`)
      }

      goalLogger.logCreate(data, userId, 'Goal created successfully')
      console.log('[GOAL_CREATED]', { goalId: data.id, title: data.title, progress_type: data.progress_type })
      return data
    } catch (err) {
      goalLogger.logError('CREATE_GOAL', err, undefined, userId, 'Exception in createGoal')
      throw err
    }
  }

  static async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    let userId: string | undefined
    try {
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }
      userId = user.id

      console.log('Updating goal:', goalId, 'for user:', user.id)
      goalLogger.logUpdate(goalId, updates, userId, 'Starting goal update')

      // Remove fields that shouldn't be updated or might cause errors
      const { updated_at, created_at, id, user_id, reflection, ...updateData } = updates
      
      console.log('Cleaned update data:', updateData)
      goalLogger.logUpdate(goalId, updateData, userId, 'Cleaned update data prepared')

      // Auto-calculate progress if current_value and target_value are provided
      if (updateData.current_value !== undefined && updateData.target_value !== undefined) {
        const { current_value, target_value } = updateData
        
        if (target_value > 0) {
          // Standard "higher is better" calculation
          const calculatedProgress = Math.min(100, Math.max(0, (current_value / target_value) * 100))
          updateData.progress = Math.round(calculatedProgress)
          console.log(`Auto-calculated progress: ${current_value}/${target_value} = ${updateData.progress}%`)
        }
      }

      // Also remove any undefined fields
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      )

      console.log('Cleaned update data:', cleanUpdateData)

      goalLogger.logUpdate(goalId, cleanUpdateData, userId, 'About to execute database update')

      // Update goal with user authentication - RLS will ensure user can only update their own goals
      const { data, error } = await supabase
        .from('goals')
        .update(cleanUpdateData)
        .eq('id', goalId)
        .eq('user_id', user.id)  // Ensure user can only update their own goals
        .select()
        .single()

      if (error) {
        goalLogger.logError('UPDATE_GOAL', error, goalId, userId, 'Database update failed')
        if (error.code === 'PGRST116') {
          throw new Error('Goal not found or you do not have permission to update it.')
        }
        throw new Error(`Failed to update goal: ${error.message}`)
      }

      if (!data) {
        goalLogger.logError('UPDATE_GOAL', { message: 'No data returned' }, goalId, userId, 'Update returned no data')
        throw new Error('Goal not found or you do not have permission to update it.')
      }

      console.log('Goal updated successfully:', data)
      goalLogger.logUpdate(goalId, data, userId, 'Goal update completed successfully')
      return data
    } catch (err) {
      goalLogger.logError('UPDATE_GOAL', err, goalId, userId, 'Exception in updateGoal')
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

  /**
   * Convert goal between manual and milestone tracking types
   */
  static async convertGoalType(goalId: string, newProgressType: 'manual' | 'milestone'): Promise<Goal> {
    let userId: string | undefined
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      userId = user.id

      // Get current goal with milestones
      const currentGoal = await this.getGoalWithMilestones(goalId)
      if (!currentGoal) {
        throw new Error('Goal not found')
      }

      const fromType = currentGoal.progress_type || 'manual'
      goalLogger.logConvert(goalId, fromType, newProgressType, userId, {
        currentProgress: currentGoal.progress,
        milestoneCount: currentGoal.milestones?.length || 0
      })

      // If already the target type, return as-is
      if (currentGoal.progress_type === newProgressType) {
        goalLogger.logConvert(goalId, fromType, newProgressType, userId, { message: 'Already target type, no conversion needed' })
        return currentGoal
      }

      let updatedGoal: Goal

      if (newProgressType === 'milestone') {
        // Converting from manual to milestone-based
        console.log('Converting goal to milestone tracking')
        updatedGoal = await this.updateGoal(goalId, {
          progress_type: 'milestone'
        })
        goalLogger.logConvert(goalId, fromType, newProgressType, userId, { message: 'Converted to milestone tracking', preservedProgress: updatedGoal.progress })
      } else {
        // Converting from milestone to manual
        console.log('Converting goal to manual tracking, deleting milestones')
        
        // Calculate current progress from milestones if they exist
        let currentProgress = currentGoal.progress
        if (currentGoal.milestones && currentGoal.milestones.length > 0) {
          const { MilestonesService } = await import('./milestones')
          const useWeighted = currentGoal.milestones.some(m => m.weight > 1)
          currentProgress = MilestonesService.calculateMilestoneProgress(currentGoal.milestones, useWeighted)
          goalLogger.logConvert(goalId, fromType, newProgressType, userId, { message: 'Calculated progress from milestones', calculatedProgress: currentProgress, milestoneCount: currentGoal.milestones.length })
        }

        // Delete all milestones first
        if (currentGoal.milestones && currentGoal.milestones.length > 0) {
          const { error: deleteError } = await supabase
            .from('milestones')
            .delete()
            .eq('goal_id', goalId)

          if (deleteError) {
            goalLogger.logError('CONVERT_GOAL', deleteError, goalId, userId, 'Failed to delete milestones during conversion')
            throw new Error('Failed to delete existing milestones')
          }
          goalLogger.logConvert(goalId, fromType, newProgressType, userId, { message: `Deleted ${currentGoal.milestones.length} milestones` })
        }

        // Update goal to manual tracking with preserved progress
        updatedGoal = await this.updateGoal(goalId, {
          progress_type: 'manual',
          progress: currentProgress
        })
        goalLogger.logConvert(goalId, fromType, newProgressType, userId, { message: 'Converted to manual tracking', finalProgress: updatedGoal.progress })
      }

      return updatedGoal
    } catch (err) {
      goalLogger.logError('CONVERT_GOAL', err, goalId, userId, 'Exception in convertGoalType')
      throw err
    }
  }

  static async deleteGoal(goalId: string): Promise<void> {
    let userId: string | undefined
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      userId = user.id

      goalLogger.logDelete(goalId, userId, 'Starting goal deletion')

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', userId)  // Ensure user can only delete their own goals

      if (error) {
        goalLogger.logError('DELETE_GOAL', error, goalId, userId, 'Database delete failed')
        throw new Error(`Failed to delete goal: ${error.message}`)
      }

      goalLogger.logDelete(goalId, userId, 'Goal deleted successfully')
      console.log('[GOAL_DELETED]', { goalId, userId })
    } catch (err) {
      goalLogger.logError('DELETE_GOAL', err, goalId, userId, 'Exception in deleteGoal')
      throw err
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