-- Add related_goal_id column to journal_entries table for goal-journal linking
-- Run this SQL in your Supabase SQL editor

-- Add the column (if it doesn't exist)
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS related_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_related_goal_id 
ON journal_entries(related_goal_id);

-- Update RLS policies if needed (should inherit from existing policies)
-- The existing RLS policies on journal_entries should automatically apply to the new column

-- Optional: Add a comment for documentation
COMMENT ON COLUMN journal_entries.related_goal_id IS 'Optional reference to a related goal for cross-feature integration';