-- Add missing columns to goals table for automatic progress calculation
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS current_value NUMERIC,
ADD COLUMN IF NOT EXISTS target_value NUMERIC;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'goals' 
AND table_schema = 'public'
ORDER BY ordinal_position;