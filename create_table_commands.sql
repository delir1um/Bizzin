-- Execute these commands in your Supabase SQL Editor to fix HEAD request errors

-- 1. Create the user_plans table
CREATE TABLE IF NOT EXISTS public.user_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  amount_paid numeric(10,2) DEFAULT 0,
  UNIQUE(user_id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for user data access
CREATE POLICY "Users can view their own plans" ON public.user_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans" ON public.user_plans  
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans" ON public.user_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);

-- 5. Create default plans for existing users (optional)
INSERT INTO public.user_plans (user_id, plan_type)
SELECT id, 'free'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_plans)
ON CONFLICT (user_id) DO NOTHING;