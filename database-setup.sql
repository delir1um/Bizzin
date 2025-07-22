-- Goals table schema for Supabase
-- Run this SQL in your Supabase SQL editor to set up the goals table

-- Create the goals table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold', 'at_risk')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    target_value INTEGER,
    current_value INTEGER,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category TEXT
);

-- If the table already exists without the category column, add it
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS category TEXT;

-- Enable Row Level Security
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own goals
CREATE POLICY "Users can view own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own goals
CREATE POLICY "Users can insert own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own goals
CREATE POLICY "Users can update own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own goals
CREATE POLICY "Users can delete own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON public.goals(deadline);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_goals_updated_at 
    BEFORE UPDATE ON public.goals
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - replace with your own user ID from auth.users)
-- First, get your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- Then replace 'YOUR_USER_ID_HERE' with your actual UUID

-- INSERT INTO public.goals (
--     title,
--     description,
--     status,
--     progress,
--     target_value,
--     current_value,
--     deadline,
--     user_id,
--     priority,
--     category
-- ) VALUES 
-- (
--     'Reach 10,000 Monthly Active Users',
--     'Grow the user base to 10,000 monthly active users through marketing campaigns and product improvements.',
--     'in_progress',
--     75,
--     10000,
--     7500,
--     '2024-03-31T23:59:59Z',
--     'YOUR_USER_ID_HERE',
--     'high',
--     'Growth'
-- ),
-- (
--     'Launch Premium Features',
--     'Complete development and launch premium subscription features including advanced analytics and priority support.',
--     'at_risk',
--     60,
--     10,
--     6,
--     '2024-02-15T23:59:59Z',
--     'YOUR_USER_ID_HERE',
--     'high',
--     'Product'
-- ),
-- (
--     'Complete MVP Development',
--     'Finish all core features for the minimum viable product including user registration, basic functionality, and initial analytics.',
--     'completed',
--     100,
--     NULL,
--     NULL,
--     '2024-01-10T23:59:59Z',
--     'YOUR_USER_ID_HERE',
--     'high',
--     'Development'
-- );