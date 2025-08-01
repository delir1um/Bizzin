-- Query to check the actual structure of your user_plans table
-- Run this to see what columns exist, then we can create a compatible setup

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_plans'
ORDER BY ordinal_position;