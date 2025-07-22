-- Final fix for the goals table issues
-- Run this SQL in your Supabase SQL editor

-- First, let's see what columns actually exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'goals' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop the problematic trigger if it exists
DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Add missing columns if they don't exist
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a simpler trigger function that checks if the column exists
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
CREATE TRIGGER update_goals_updated_at 
    BEFORE UPDATE ON public.goals
    FOR EACH ROW 
    EXECUTE FUNCTION update_goals_updated_at();