-- Add missing columns to journal_entries table
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS reading_time INTEGER;
