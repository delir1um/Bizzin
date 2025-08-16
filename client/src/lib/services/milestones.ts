import { supabase } from '@/lib/supabase'
import { Milestone } from '@/types/goals'
// Define types locally for now to avoid import issues
type CreateMilestone = {
  goal_id: string
  title: string
  description?: string
  status?: 'todo' | 'in_progress' | 'done'
  due_date?: string
  weight?: number
  order_index: number
}

type UpdateMilestone = {
  title?: string
  description?: string
  status?: 'todo' | 'in_progress' | 'done'
  due_date?: string
  weight?: number
  order_index?: number
}

export class MilestonesService {
  static async getMilestonesByGoalId(goalId: string): Promise<Milestone[]> {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('goal_id', goalId)
        .order('order_index', { ascending: true })

      if (error) {
        // If table doesn't exist, return empty array for Phase 1
        if (error.code === '42P01') {
          console.log('Milestones table not created yet, returning empty array for Phase 1')
          return []
        }
        console.error('Error fetching milestones:', error)
        throw new Error(`Failed to fetch milestones: ${error.message}`)
      }

      return data || []
    } catch (err) {
      console.log('Database error, returning empty milestones for Phase 1:', err)
      return []
    }
  }

  static async createMilestone(milestone: CreateMilestone): Promise<Milestone> {
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const milestoneWithUserId = {
        ...milestone,
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('milestones')
        .insert([milestoneWithUserId])
        .select()
        .single()

      if (error) {
        // If table doesn't exist, return a mock milestone for Phase 1 testing
        if (error.code === '42P01') {
          console.log('Milestones table not created yet, returning mock milestone for Phase 1')
          return {
            id: `temp-${Date.now()}`,
            ...milestoneWithUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
        console.error('Error creating milestone:', error)
        throw new Error(`Failed to create milestone: ${error.message}`)
      }

      return data
    } catch (err) {
      console.error('Error in createMilestone:', err)
      throw err
    }
  }

  static async updateMilestone(id: string, updates: UpdateMilestone): Promise<Milestone> {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        // If table doesn't exist or temp ID, simulate update for Phase 1
        if (error.code === '42P01' || id.startsWith('temp-')) {
          console.log('Milestones table not created yet or temp milestone, simulating update for Phase 1')
          return {
            id,
            goal_id: 'temp',
            title: updates.title || 'Updated milestone',
            status: updates.status || 'todo',
            weight: updates.weight || 1,
            order_index: updates.order_index || 0,
            user_id: 'temp',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...updates
          }
        }
        console.error('Error updating milestone:', error)
        throw new Error(`Failed to update milestone: ${error.message}`)
      }

      return data
    } catch (err) {
      console.error('Error in updateMilestone:', err)
      throw err
    }
  }

  static async deleteMilestone(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id)

      if (error) {
        // If table doesn't exist or temp ID, simulate delete for Phase 1
        if (error.code === '42P01' || id.startsWith('temp-')) {
          console.log('Milestones table not created yet or temp milestone, simulating delete for Phase 1')
          return
        }
        console.error('Error deleting milestone:', error)
        throw new Error(`Failed to delete milestone: ${error.message}`)
      }
    } catch (err) {
      console.error('Error in deleteMilestone:', err)
      throw err
    }
  }

  static async reorderMilestones(goalId: string, milestoneOrders: { id: string; order_index: number }[]): Promise<void> {
    const { error } = await supabase.rpc('update_milestone_order', {
      goal_id: goalId,
      milestone_orders: milestoneOrders
    })

    if (error) {
      console.error('Error reordering milestones:', error)
      throw new Error(`Failed to reorder milestones: ${error.message}`)
    }
  }

  static calculateMilestoneProgress(milestones: Milestone[], isWeighted: boolean = false): number {
    if (milestones.length === 0) return 0

    if (isWeighted) {
      const totalWeight = milestones.reduce((sum, m) => sum + m.weight, 0)
      const completedWeight = milestones
        .filter(m => m.status === 'done')
        .reduce((sum, m) => sum + m.weight, 0)
      
      return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0
    } else {
      const completedCount = milestones.filter(m => m.status === 'done').length
      return Math.round((completedCount / milestones.length) * 100)
    }
  }

  static getNextOrderIndex(milestones: Milestone[]): number {
    if (milestones.length === 0) return 0
    return Math.max(...milestones.map(m => m.order_index)) + 1
  }
}