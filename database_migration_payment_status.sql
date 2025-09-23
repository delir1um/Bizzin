-- Migration: Add Payment Status Tracking to User Plans and Create Payment Transactions Table
-- Date: 2025-09-23
-- Purpose: Enable production-ready subscription management with payment status tracking

-- 1. Add new columns to user_plans table for payment status tracking
ALTER TABLE public.user_plans 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'active' CHECK (payment_status IN ('active', 'pending', 'failed', 'cancelled', 'suspended', 'grace_period')),
ADD COLUMN IF NOT EXISTS last_payment_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS next_payment_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS failed_payment_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS grace_period_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS paystack_customer_code text,
ADD COLUMN IF NOT EXISTS paystack_subscription_code text;

-- 2. Create payment_transactions table for audit trail
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id text NOT NULL UNIQUE,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'ZAR' NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  payment_method text DEFAULT 'paystack' CHECK (payment_method IN ('paystack', 'manual')),
  paystack_reference text,
  paystack_authorization_code text,
  subscription_id text,
  failure_reason text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for payment_transactions
CREATE POLICY "Users can view their own payment transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert payment transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (true); -- Allow system inserts from webhooks

CREATE POLICY "System can update payment transactions" ON public.payment_transactions
  FOR UPDATE USING (true); -- Allow system updates from webhooks

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paystack_reference ON public.payment_transactions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_user_plans_payment_status ON public.user_plans(payment_status);
CREATE INDEX IF NOT EXISTS idx_user_plans_next_payment_date ON public.user_plans(next_payment_date);

-- 6. Update existing user_plans to have default payment status
UPDATE public.user_plans 
SET payment_status = CASE 
  WHEN plan_type = 'premium' THEN 'active'
  WHEN plan_type = 'free' AND expires_at IS NOT NULL AND expires_at > now() THEN 'active'
  WHEN plan_type = 'free' AND expires_at IS NOT NULL AND expires_at <= now() THEN 'suspended'
  ELSE 'active'
END
WHERE payment_status IS NULL;

-- 7. Set next_payment_date for active premium plans (30 days from now)
UPDATE public.user_plans 
SET next_payment_date = now() + INTERVAL '30 days'
WHERE plan_type = 'premium' AND payment_status = 'active' AND next_payment_date IS NULL;

COMMENT ON TABLE public.payment_transactions IS 'Audit trail of all payment transactions for subscription management';
COMMENT ON COLUMN public.user_plans.payment_status IS 'Current payment status of the subscription';
COMMENT ON COLUMN public.user_plans.failed_payment_count IS 'Number of consecutive failed payment attempts';
COMMENT ON COLUMN public.user_plans.grace_period_end IS 'End date of grace period after payment failure';