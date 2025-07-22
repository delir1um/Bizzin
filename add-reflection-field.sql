-- Add reflection field to goals table
-- Run this SQL in your Supabase SQL editor

ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS reflection TEXT;