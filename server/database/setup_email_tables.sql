-- Daily Email System Database Setup
-- Run this in your Supabase SQL editor to create the required tables

-- Daily Email Settings Table
CREATE TABLE IF NOT EXISTS daily_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enabled BOOLEAN DEFAULT false NOT NULL,
  send_time TEXT DEFAULT '09:00' NOT NULL, -- HH:MM format
  timezone TEXT DEFAULT 'UTC' NOT NULL,
  content_preferences JSONB DEFAULT '{"journal_prompts": true, "goal_summaries": true, "business_insights": true, "milestone_reminders": true}' NOT NULL,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id)
);

-- Daily Email Content Table
CREATE TABLE IF NOT EXISTS daily_email_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_date DATE NOT NULL,
  journal_prompt TEXT NOT NULL,
  goal_summary TEXT NOT NULL,
  business_insights TEXT NOT NULL,
  sentiment_trend TEXT NOT NULL,
  milestone_reminders TEXT NOT NULL,
  personalization_data JSONB DEFAULT '{}' NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, email_date)
);

-- Email Analytics Table
CREATE TABLE IF NOT EXISTS email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_type TEXT CHECK (email_type IN ('daily_digest', 'goal_reminder', 'milestone_alert')) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  content_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add updated_at trigger for daily_email_settings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_email_settings_updated_at 
  BEFORE UPDATE ON daily_email_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE daily_email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_email_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only access their own email settings
CREATE POLICY "Users can view own email settings" ON daily_email_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email settings" ON daily_email_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email settings" ON daily_email_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only view their own email content
CREATE POLICY "Users can view own email content" ON daily_email_content
  FOR SELECT USING (auth.uid() = user_id);

-- Server can insert email content for any user (service role)
CREATE POLICY "Service can insert email content" ON daily_email_content
  FOR INSERT WITH CHECK (true);

-- Server can update email content for tracking (service role)
CREATE POLICY "Service can update email content" ON daily_email_content
  FOR UPDATE WITH CHECK (true);

-- Analytics accessible by admins and service role
CREATE POLICY "Service can manage analytics" ON email_analytics
  FOR ALL WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_email_settings_user_enabled 
  ON daily_email_settings(user_id, enabled);

CREATE INDEX IF NOT EXISTS idx_daily_email_content_user_date 
  ON daily_email_content(user_id, email_date);

CREATE INDEX IF NOT EXISTS idx_daily_email_content_sent_at 
  ON daily_email_content(sent_at) WHERE sent_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_analytics_user_type 
  ON email_analytics(user_id, email_type);

CREATE INDEX IF NOT EXISTS idx_email_analytics_sent_at 
  ON email_analytics(sent_at);

-- Update user_profiles table to include email preferences (if columns don't exist)
DO $$
BEGIN
    -- Add email notification columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'email_notifications') THEN
        ALTER TABLE user_profiles ADD COLUMN email_notifications BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'daily_email') THEN
        ALTER TABLE user_profiles ADD COLUMN daily_email BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'daily_email_time') THEN
        ALTER TABLE user_profiles ADD COLUMN daily_email_time TEXT DEFAULT '09:00';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'timezone') THEN
        ALTER TABLE user_profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
    END IF;
END $$;

-- Function to create default email settings for new users
CREATE OR REPLACE FUNCTION create_default_email_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_email_settings (user_id, enabled, send_time, timezone)
  VALUES (
    NEW.id, 
    false, 
    '09:00',
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create email settings when user signs up
DROP TRIGGER IF EXISTS create_email_settings_trigger ON auth.users;
CREATE TRIGGER create_email_settings_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_email_settings();

-- Grant permissions to service role
GRANT ALL ON daily_email_settings TO service_role;
GRANT ALL ON daily_email_content TO service_role;
GRANT ALL ON email_analytics TO service_role;