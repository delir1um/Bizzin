-- Add enhanced digest columns to daily_email_content table
-- Run this SQL to add the missing columns for the enhanced daily digest features

ALTER TABLE daily_email_content 
ADD COLUMN IF NOT EXISTS motivation_quote TEXT,
ADD COLUMN IF NOT EXISTS top_goal TEXT,
ADD COLUMN IF NOT EXISTS journal_snapshot TEXT,
ADD COLUMN IF NOT EXISTS business_health TEXT,
ADD COLUMN IF NOT EXISTS action_nudges TEXT,
ADD COLUMN IF NOT EXISTS smart_suggestions TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_email_content_user_date ON daily_email_content(user_id, email_date);
CREATE INDEX IF NOT EXISTS idx_daily_email_content_sent_at ON daily_email_content(sent_at) WHERE sent_at IS NOT NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'daily_email_content' 
ORDER BY ordinal_position;