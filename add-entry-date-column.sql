-- Add entry_date column to journal_entries table for past date journal creation
-- This allows users to create journal entries for dates other than today
-- Run this in Supabase SQL Editor

-- Add entry_date column to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS entry_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN journal_entries.entry_date IS 'Optional custom date for journal entry, allows creating entries for past dates';

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_date 
ON journal_entries(entry_date) 
WHERE entry_date IS NOT NULL;

-- Update existing entries to have entry_date based on created_at if null
UPDATE journal_entries 
SET entry_date = created_at::date 
WHERE entry_date IS NULL;