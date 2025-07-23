-- Add sentiment_data column to journal_entries table
-- This column will store AI-generated business sentiment analysis

ALTER TABLE journal_entries 
ADD COLUMN sentiment_data JSONB;

-- Create an index on sentiment_data for faster queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_sentiment_data 
ON journal_entries USING GIN (sentiment_data);

-- Add a comment to document the column
COMMENT ON COLUMN journal_entries.sentiment_data IS 'AI-generated business sentiment analysis including mood, confidence, energy, emotions, insights, and business category';