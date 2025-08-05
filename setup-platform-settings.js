// Simple direct database table creation
import { createClient } from '@supabase/supabase-js';

// Use environment variables
const supabaseUrl = 'https://giahpkiwivxpocikndix.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpYWhwa2l3aXZ4cG9jaWtuZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NzQ3MjYsImV4cCI6MjA2OTI1MDcyNn0.TqaBaEmyWZy4i7CCbkHN1s_Yt3P6N4bY2nJPZYPjsgo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupPlatformSettings() {
  console.log('Setting up platform_settings table...');
  
  // First, try creating the table with raw SQL
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS platform_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pre_launch_mode BOOLEAN DEFAULT FALSE NOT NULL,
      launch_message TEXT DEFAULT 'We''re putting the finishing touches on Bizzin! Sign up to be notified when we launch.',
      maintenance_mode BOOLEAN DEFAULT FALSE NOT NULL,
      maintenance_message TEXT DEFAULT 'We''re currently performing maintenance. Please check back soon.',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `;

  try {
    const { error: createError } = await supabase.rpc('sql', { query: createTableSQL });
    
    if (createError) {
      console.error('Create table error:', createError);
      // Try alternative method
      console.log('Trying direct insert method...');
    } else {
      console.log('Table created successfully');
    }

    // Check if settings exist
    const { data: existing, error: checkError } = await supabase
      .from('platform_settings')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('Check error:', checkError);
      return;
    }

    if (!existing || existing.length === 0) {
      console.log('No settings found, inserting default...');
      
      const { data, error } = await supabase
        .from('platform_settings')
        .insert({
          pre_launch_mode: false,
          launch_message: "We're putting the finishing touches on *Bizzin*! Sign up to be notified when we launch.",
          maintenance_mode: false,
          maintenance_message: "We're currently performing maintenance. Please check back soon."
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
      } else {
        console.log('Default settings created:', data);
      }
    } else {
      console.log('Settings already exist:', existing[0]);
    }

  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupPlatformSettings().then(() => {
  console.log('Setup complete');
  process.exit(0);
}).catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});