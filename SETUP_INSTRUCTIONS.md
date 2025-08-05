# Fix Pre-Launch Toggle - Database Setup Required

## The Issue
The `platform_settings` table doesn't exist in your Supabase database yet, which is causing the toggle error.

## Quick Fix (2 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard/projects
2. Select your Bizzin project
3. Click "SQL Editor" in the left sidebar

### Step 2: Run This SQL
Copy and paste this exact code, then click "Run":

```sql
-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_launch_mode BOOLEAN DEFAULT FALSE NOT NULL,
  launch_message TEXT DEFAULT 'We''re putting the finishing touches on Bizzin! Sign up to be notified when we launch.',
  maintenance_mode BOOLEAN DEFAULT FALSE NOT NULL,
  maintenance_message TEXT DEFAULT 'We''re currently performing maintenance. Please check back soon.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Insert default settings
INSERT INTO platform_settings (pre_launch_mode, launch_message, maintenance_mode, maintenance_message)
VALUES (false, 'We''re putting the finishing touches on Bizzin! Sign up to be notified when we launch.', false, 'We''re currently performing maintenance. Please check back soon.')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
DROP POLICY IF EXISTS "Allow all operations on platform_settings" ON platform_settings;
CREATE POLICY "Allow all operations on platform_settings" ON platform_settings
FOR ALL USING (true) WITH CHECK (true);
```

### Step 3: Test the Toggle
1. Go back to your Admin Dashboard
2. The Pre-Launch Toggle should now work without errors
3. You can switch between "Pre-Launch Mode" and "Live Platform"

## What This Does
- Creates the `platform_settings` table with proper structure
- Adds default settings (pre-launch mode disabled)
- Sets up proper security policies
- Enables the admin toggle functionality

## After Setup
Once this is complete, you'll have full control over:
- ✅ Toggle between pre-launch and live modes
- ✅ Customize pre-launch signup messages
- ✅ Database-driven platform control (no more environment variables)
- ✅ Real-time mode switching from admin dashboard