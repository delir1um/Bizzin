export type PlanType = 'free' | 'premium' | 'trial'

export type PaymentStatus = 'active' | 'pending' | 'failed' | 'cancelled' | 'suspended' | 'grace_period'

export interface UserPlan {
  id: string
  user_id: string
  plan_type: PlanType
  created_at: string
  updated_at: string
  expires_at?: string
  cancelled_at?: string
  amount_paid?: number
  // New payment status tracking fields
  payment_status?: PaymentStatus
  last_payment_date?: string
  next_payment_date?: string
  failed_payment_count?: number
  grace_period_end?: string
  paystack_customer_code?: string
  paystack_subscription_code?: string
}

export interface UsageLimits {
  id: string
  user_id: string
  month_year: string
  documents_uploaded: number
  journal_entries_created: number
  goals_created: number
  calculator_uses: Record<string, number>
  storage_used: number
  created_at: string
  updated_at: string
}

export interface PlanLimits {
  plan_type: PlanType
  storage_limit: number
  max_file_size: number
  monthly_documents: number
  monthly_journal_entries: number
  max_active_goals: number
  daily_calculator_uses: number
}

export interface UsageStatus {
  current_usage: UsageLimits
  plan_limits: PlanLimits
  user_plan: UserPlan
  can_upload_document: boolean
  can_create_journal_entry: boolean
  can_create_goal: boolean
  can_use_calculator: (calculatorId: string) => boolean
  storage_percentage: number
  documents_percentage: number
  journal_percentage: number
}

export interface PaymentTransaction {
  id: string
  user_id: string
  transaction_id: string
  amount: number
  currency: string
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  payment_method: 'paystack' | 'manual'
  paystack_reference?: string
  paystack_authorization_code?: string
  subscription_id?: string
  failure_reason?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}