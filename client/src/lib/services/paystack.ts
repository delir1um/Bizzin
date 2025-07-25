import { supabase } from '@/lib/supabase'

export interface PaystackConfig {
  reference: string
  email: string
  amount: number // Amount in cents (ZAR)
  currency: 'ZAR'
  publicKey: string
  metadata?: {
    user_id: string
    plan_type: 'premium'
    subscription_type: 'monthly' | 'annual'
    custom_fields: Array<{ display_name: string; variable_name: string; value: string }>
  }
}

export interface PaystackResponse {
  reference: string
  status: 'success' | 'failed' | 'cancelled'
  message: string
  transaction: string
  trxref: string
}

export class PaystackService {
  private static readonly PREMIUM_MONTHLY_PRICE = 9999 // ZAR 99.99 in cents
  private static readonly PREMIUM_ANNUAL_PRICE = 99999 // ZAR 999.99 in cents (2 months free)
  
  // Paystack test public key - safe to use in frontend
  private static readonly PUBLIC_KEY = 'pk_test_2c4bb010982237f93c2b7c50894bd8e52f18bb6e'

  static generateReference(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `bizzin_${timestamp}_${random}`
  }

  static createPaymentConfig(
    email: string, 
    userId: string, 
    subscriptionType: 'monthly' | 'annual' = 'monthly'
  ): PaystackConfig {
    const amount = subscriptionType === 'annual' 
      ? this.PREMIUM_ANNUAL_PRICE 
      : this.PREMIUM_MONTHLY_PRICE

    return {
      reference: this.generateReference(),
      email,
      amount,
      currency: 'ZAR',
      publicKey: this.PUBLIC_KEY,
      metadata: {
        user_id: userId,
        plan_type: 'premium',
        subscription_type: subscriptionType,
        custom_fields: []
      }
    }
  }

  static formatAmount(amount: number): string {
    return `R${(amount / 100).toFixed(2)}`
  }

  static getSubscriptionPrice(type: 'monthly' | 'annual'): number {
    return type === 'annual' ? this.PREMIUM_ANNUAL_PRICE : this.PREMIUM_MONTHLY_PRICE
  }

  // Handle successful payment - upgrade user to premium
  static async handlePaymentSuccess(response: PaystackResponse): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // In production, you would verify the payment with Paystack API using secret key
      // For now, we'll trust the frontend response (not recommended for production)
      
      // Update user plan to premium
      const { error: planError } = await supabase
        .from('user_plans')
        .upsert({
          user_id: user.id,
          plan_type: 'premium',
          stripe_customer_id: response.reference, // Store reference for future use
          updated_at: new Date().toISOString()
        })

      if (planError) {
        console.error('Error updating user plan:', planError)
        return false
      }

      // Reset monthly usage limits for premium user
      const currentMonth = new Date().toISOString().substring(0, 7)
      const { error: usageError } = await supabase
        .from('usage_limits')
        .upsert({
          user_id: user.id,
          month_year: currentMonth,
          // Premium users get high limits
          documents_uploaded: 0,
          journal_entries_created: 0,
          goals_created: 0,
          calculator_uses: 0,
          storage_used: 0,
          updated_at: new Date().toISOString()
        })

      if (usageError) {
        console.error('Error updating usage limits:', usageError)
      }

      return true
    } catch (error) {
      console.error('Error handling payment success:', error)
      return false
    }
  }

  // Log payment attempt for analytics
  static async logPaymentAttempt(
    userId: string, 
    amount: number, 
    reference: string, 
    status: 'initiated' | 'success' | 'failed' | 'cancelled'
  ): Promise<void> {
    try {
      // In a real app, you'd have a payments table to track this
      console.log('Payment attempt:', { userId, amount, reference, status })
    } catch (error) {
      console.error('Error logging payment attempt:', error)
    }
  }
}