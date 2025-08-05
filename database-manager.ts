import { supabase } from './client/src/lib/supabase.js';

async function createPlatformSettingsTable() {
  console.log('Creating platform_settings table...');
  
  try {
    // First check if table exists by trying to query it
    const { data: testData, error: testError } = await supabase
      .from('platform_settings')
      .select('*')
      .limit(1);

    if (testError && testError.code === '42P01') {
      console.log('Table does not exist, needs to be created via SQL');
      console.log('Please run this SQL in your Supabase SQL editor:');
      console.log(`
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
      `);
    } else if (testError) {
      console.error('Other error:', testError);
    } else {
      console.log('Table exists, data found:', testData);
      
      // If no data, insert default
      if (!testData || testData.length === 0) {
        const { data: insertedData, error: insertError } = await supabase
          .from('platform_settings')
          .insert({
            pre_launch_mode: false,
            launch_message: "We're putting the finishing touches on Bizzin! Sign up to be notified when we launch.",
            maintenance_mode: false,
            maintenance_message: "We're currently performing maintenance. Please check back soon."
          })
          .select()
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
          console.log('Default settings inserted:', insertedData);
        }
      }
    }
  } catch (error) {
    console.error('Setup error:', error);
  }
}

createPlatformSettingsTable();