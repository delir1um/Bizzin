-- Plan System Setup for Bizzin
-- Execute these SQL commands in your Supabase SQL Editor

-- Create user_plans table to track user subscription status
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id)
);

-- Create usage_limits table to track user consumption
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  documents_uploaded INTEGER DEFAULT 0,
  journal_entries_created INTEGER DEFAULT 0,
  goals_created INTEGER DEFAULT 0,
  calculator_uses JSONB DEFAULT '{}', -- Track uses per calculator
  storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, month_year)
);

-- Enable RLS on new tables
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_plans
CREATE POLICY "Users can view own plan" ON user_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own plan" ON user_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plan" ON user_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for usage_limits
CREATE POLICY "Users can view own usage" ON usage_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON usage_limits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON usage_limits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to automatically create free plan for new users
CREATE OR REPLACE FUNCTION handle_new_user_plan()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_plans (user_id, plan_type)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create plan when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created_plan
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_plan();

-- Function to get or create current month usage
CREATE OR REPLACE FUNCTION get_or_create_usage_limits(user_uuid UUID, current_month VARCHAR(7))
RETURNS usage_limits AS $$
DECLARE
  usage_record usage_limits;
BEGIN
  SELECT * INTO usage_record FROM usage_limits 
  WHERE user_id = user_uuid AND month_year = current_month;
  
  IF NOT FOUND THEN
    INSERT INTO usage_limits (user_id, month_year)
    VALUES (user_uuid, current_month)
    RETURNING * INTO usage_record;
  END IF;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add plan_limits view for easy reference
CREATE OR REPLACE VIEW plan_limits AS
SELECT 
  'free' as plan_type,
  500 * 1024 * 1024 as storage_limit, -- 500MB
  50 * 1024 * 1024 as max_file_size, -- 50MB
  20 as monthly_documents,
  10 as monthly_journal_entries,
  5 as max_active_goals,
  3 as daily_calculator_uses
UNION ALL
SELECT 
  'premium' as plan_type,
  10 * 1024 * 1024 * 1024 as storage_limit, -- 10GB
  100 * 1024 * 1024 as max_file_size, -- 100MB
  999999 as monthly_documents,
  999999 as monthly_journal_entries,
  999999 as max_active_goals,
  999999 as daily_calculator_uses;