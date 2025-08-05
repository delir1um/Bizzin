import { createClient } from '@supabase/supabase-js';

// Use your actual Supabase credentials
const supabaseUrl = 'https://giahpkiwivxpocikndix.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpYWhwa2l3aXZ4cG9jaWtuZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY3NDcyNiwiZXhwIjoyMDY5MjUwNzI2fQ.MmvCnAJD0kKn-qGpqyC5ZUjAJ7a4MNb6z7z7LmSqJeo'; // Service role key for admin operations

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPlatformSettingsTable() {
  console.log('Creating platform_settings table...');
  
  try {
    // Create the table using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
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

        -- Enable RLS
        ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

        -- Create policy
        DROP POLICY IF EXISTS "Allow all operations on platform_settings" ON platform_settings;
        CREATE POLICY "Allow all operations on platform_settings" ON platform_settings
        FOR ALL USING (true) WITH CHECK (true);
      `
    });

    if (error) {
      console.error('SQL execution error:', error);
    } else {
      console.log('Table created successfully:', data);
    }

    // Verify the table was created by querying it
    const { data: testData, error: testError } = await supabase
      .from('platform_settings')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('Table verification error:', testError);
    } else {
      console.log('Table verified successfully:', testData);
    }

  } catch (error) {
    console.error('Setup error:', error);
  }
}

createPlatformSettingsTable();