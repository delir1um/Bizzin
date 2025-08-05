-- Create early_signups table for pre-launch lead capture
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS early_signups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  first_name varchar(100) NOT NULL,
  business_name varchar(200) NOT NULL,
  business_type varchar(100) NOT NULL,
  business_size varchar(50) NOT NULL,
  signup_date timestamp with time zone DEFAULT now() NOT NULL,
  source varchar(100) DEFAULT 'pre_launch_landing',
  is_notified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_early_signups_email ON early_signups(email);
CREATE INDEX IF NOT EXISTS idx_early_signups_date ON early_signups(signup_date);
CREATE INDEX IF NOT EXISTS idx_early_signups_business_type ON early_signups(business_type);

-- Enable Row Level Security
ALTER TABLE early_signups ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert (for lead capture)
CREATE POLICY "Allow public signup insertion" ON early_signups
  FOR INSERT WITH CHECK (true);

-- Policy to allow authenticated users to view all signups (for admin purposes)
CREATE POLICY "Allow authenticated users to view signups" ON early_signups
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to update notification status
CREATE POLICY "Allow authenticated users to update signups" ON early_signups
  FOR UPDATE USING (auth.role() = 'authenticated');