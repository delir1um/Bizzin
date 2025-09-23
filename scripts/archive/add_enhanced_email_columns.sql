-- Add enhanced content columns to daily_email_content table
ALTER TABLE daily_email_content 
ADD COLUMN IF NOT EXISTS actionable_insights TEXT,
ADD COLUMN IF NOT EXISTS gamification_data TEXT,
ADD COLUMN IF NOT EXISTS weekly_challenge TEXT,
ADD COLUMN IF NOT EXISTS smart_recommendations TEXT;
