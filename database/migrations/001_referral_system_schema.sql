-- Migration: Referral System Schema Updates
-- Implements the complete referral system as per specification
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Add referral columns to user_profiles table (extends auth.users)
-- Note: We use user_profiles instead of directly modifying auth.users
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create referrals table 
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('captured', 'converted', 'invalid')) DEFAULT 'captured',
  created_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ,
  CONSTRAINT no_self_referral CHECK (referrer_user_id != referred_user_id)
);

-- 3. Create subscription_credits table
CREATE TABLE IF NOT EXISTS public.subscription_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  days INTEGER NOT NULL CHECK (days > 0 OR (reason = 'reversal' AND days < 0)),
  reason TEXT CHECK (reason IN ('signup_bonus', 'referrer_bonus', 'admin_adjustment', 'reversal')) NOT NULL,
  source_referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON public.user_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referred_by ON public.user_profiles(referred_by_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON public.referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_subscription_credits_user_id ON public.subscription_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_credits_applied ON public.subscription_credits(applied);
CREATE INDEX IF NOT EXISTS idx_subscription_credits_source_referral_id ON public.subscription_credits(source_referral_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event_id ON public.webhook_events(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed_at);

-- 5. Enable RLS on new tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_credits ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for referrals table
CREATE POLICY "Users can view referrals they're involved in" ON public.referrals
  FOR SELECT USING (
    auth.uid() = referrer_user_id OR 
    auth.uid() = referred_user_id
  );

-- Only service role can insert/update referrals (system operations)
CREATE POLICY "Service role can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update referrals" ON public.referrals
  FOR UPDATE USING (auth.role() = 'service_role');

-- Allow users to create referrals only for themselves as the referee
CREATE POLICY "Users can create referrals for themselves" ON public.referrals
  FOR INSERT WITH CHECK (
    auth.uid() = referred_user_id AND 
    auth.uid() != referrer_user_id AND
    status = 'captured'
  );

-- 7. Create RLS policies for subscription_credits table  
CREATE POLICY "Users can view their own credits" ON public.subscription_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can manage credits (prevent privilege escalation)
CREATE POLICY "Service role can insert credits" ON public.subscription_credits
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update credits" ON public.subscription_credits
  FOR UPDATE USING (auth.role() = 'service_role');

-- 8. Create function to generate deterministic referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  base36_chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  -- Exclude ambiguous characters: 0, O, I, 1
  clean_chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  code TEXT := '';
  hash_num BIGINT;
  temp_num BIGINT;
  i INTEGER;
  email_hash TEXT;
BEGIN
  -- Create hash from email (deterministic)
  email_hash := encode(digest(lower(user_email), 'sha256'), 'hex');
  
  -- Convert first 8 hex chars to bigint
  hash_num := ('x' || substring(email_hash, 1, 8))::bit(32)::bigint;
  
  -- Generate 8-character code from clean character set
  temp_num := abs(hash_num);
  FOR i IN 1..8 LOOP
    code := substring(clean_chars, (temp_num % length(clean_chars)) + 1, 1) || code;
    temp_num := temp_num / length(clean_chars);
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 9. Create webhook events table for idempotency
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'paystack',
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, event_id)
);

-- 10. Add constraints for idempotency
-- Prevent duplicate credit awards for the same referral
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_referral_credits
ON public.subscription_credits (user_id, reason, source_referral_id)
WHERE reason IN ('signup_bonus', 'referrer_bonus');

-- 11. Create trigger to auto-generate referral codes for new users
CREATE OR REPLACE FUNCTION public.auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL AND NEW.email IS NOT NULL THEN
    NEW.referral_code := public.generate_referral_code(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_referral_code
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_referral_code();

-- 12. Enable RLS on webhook_events table
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook events" ON public.webhook_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view webhook events" ON public.webhook_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );