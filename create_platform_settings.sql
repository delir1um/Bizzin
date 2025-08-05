-- Create platform_settings table for pre-launch mode toggle
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

-- Enable RLS (Row Level Security)
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is admin-only functionality)
CREATE POLICY "Allow all operations on platform_settings" ON platform_settings
FOR ALL USING (true) WITH CHECK (true);