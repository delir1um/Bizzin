-- Add entry_date column to journal_entries table
-- Run this in your Supabase SQL Editor

ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS entry_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN journal_entries.entry_date IS 'Optional custom date for the journal entry (defaults to created_at date)';

-- Update existing entries to use created_at date if no entry_date is set
UPDATE journal_entries 
SET entry_date = DATE(created_at) 
WHERE entry_date IS NULL;