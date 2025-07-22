-- Add missing columns to fix schema cache errors
-- Run this SQL in your Supabase SQL editor

-- Add reflection column
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS reflection TEXT;

-- Add category column (in case it's still missing)
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS category TEXT;