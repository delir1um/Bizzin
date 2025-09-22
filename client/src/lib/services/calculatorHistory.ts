import { supabase } from "@/lib/supabase"
import type { CalculatorHistory, CreateCalculatorHistory, UpdateCalculatorHistory } from "../../../../shared/schema"

export class CalculatorHistoryService {
  /**
   * Save a calculation to history
   */
  static async saveCalculation(calculation: CreateCalculatorHistory): Promise<CalculatorHistory | null> {
    try {
      // CRITICAL: Check trial expiry before allowing calculator usage
      const { PlansService } = await import('@/lib/services/plans')
      const usageStatus = await PlansService.getUserUsageStatus(calculation.user_id)
      
      if (!usageStatus?.can_use_calculator?.(calculation.calculator_type)) {
        throw new Error('Calculator usage requires an active premium subscription. Your trial may have expired.')
      }

      const { data, error } = await supabase
        .from('calculator_history')
        .insert([calculation])
        .select()
        .single()

      if (error) {
        console.error('Error saving calculation:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error saving calculation:', error)
      return null
    }
  }

  /**
   * Get calculation history for a user and calculator type
   */
  static async getCalculationHistory(
    userId: string, 
    calculatorType?: 'cash_flow' | 'break_even' | 'business_budget'
  ): Promise<CalculatorHistory[]> {
    try {
      let query = supabase
        .from('calculator_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (calculatorType) {
        query = query.eq('calculator_type', calculatorType)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching calculation history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching calculation history:', error)
      return []
    }
  }

  /**
   * Get a specific calculation by ID
   */
  static async getCalculation(id: string): Promise<CalculatorHistory | null> {
    try {
      const { data, error } = await supabase
        .from('calculator_history')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching calculation:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching calculation:', error)
      return null
    }
  }

  /**
   * Update a saved calculation
   */
  static async updateCalculation(id: string, updates: UpdateCalculatorHistory): Promise<CalculatorHistory | null> {
    try {
      const { data, error } = await supabase
        .from('calculator_history')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating calculation:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error updating calculation:', error)
      return null
    }
  }

  /**
   * Delete a saved calculation
   */
  static async deleteCalculation(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('calculator_history')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting calculation:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting calculation:', error)
      return false
    }
  }

  /**
   * Search calculations by name
   */
  static async searchCalculations(userId: string, searchTerm: string): Promise<CalculatorHistory[]> {
    try {
      const { data, error } = await supabase
        .from('calculator_history')
        .select('*')
        .eq('user_id', userId)
        .ilike('calculation_name', `%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching calculations:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error searching calculations:', error)
      return []
    }
  }

  /**
   * Get calculation statistics for user
   */
  static async getCalculationStats(userId: string): Promise<{
    totalCalculations: number;
    calculationsByType: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('calculator_history')
        .select('calculator_type')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching calculation stats:', error)
        return { totalCalculations: 0, calculationsByType: {} }
      }

      const calculationsByType = (data || []).reduce((acc, calc) => {
        acc[calc.calculator_type] = (acc[calc.calculator_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        totalCalculations: data?.length || 0,
        calculationsByType
      }
    } catch (error) {
      console.error('Error fetching calculation stats:', error)
      return { totalCalculations: 0, calculationsByType: {} }
    }
  }
}