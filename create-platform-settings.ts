import { supabase } from './client/src/lib/supabase';

async function createPlatformSettingsTable() {
  console.log('Creating platform_settings table...');
  
  // Create the table using raw SQL
  const { error: createError } = await supabase.rpc('create_platform_settings_table', {});
  
  if (createError) {
    console.log('Table might already exist, trying direct insert...');
  }
  
  // Try to insert default settings
  const { data: existingSettings, error: checkError } = await supabase
    .from('platform_settings')
    .select('*')
    .limit(1);
  
  if (checkError) {
    console.error('Error checking existing settings:', checkError);
    return;
  }
  
  if (!existingSettings || existingSettings.length === 0) {
    const { data, error } = await supabase
      .from('platform_settings')
      .insert({
        pre_launch_mode: false,
        launch_message: "We're putting the finishing touches on Bizzin! Sign up to be notified when we launch.",
        maintenance_mode: false,
        maintenance_message: "We're currently performing maintenance. Please check back soon."
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating default settings:', error);
    } else {
      console.log('Default platform settings created:', data);
    }
  } else {
    console.log('Platform settings already exist:', existingSettings[0]);
  }
}

createPlatformSettingsTable().then(() => {
  console.log('Setup complete');
  process.exit(0);
}).catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});