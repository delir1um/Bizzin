-- Fix for foreign key constraint error
-- Run this SQL in your Supabase SQL editor to remove the problematic constraint

-- Drop the foreign key constraint that's causing the error
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_user_id_fkey;

-- Check if the goals table exists and show its constraints
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.table_name = 'goals' 
    AND tc.table_schema = 'public';