// Script to disable PreLaunch mode for testing
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function disablePreLaunch() {
  try {
    console.log('🔄 Disabling PreLaunch mode...')
    
    // Update platform_settings to disable pre_launch_mode
    const { data, error } = await supabase
      .from('platform_settings')
      .update({ 
        pre_launch_mode: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'c0d1d7a8-e789-4076-8574-d442c546d5be') // Known ID from logs
      .select()

    if (error) {
      console.error('❌ Error updating platform settings:', error)
      process.exit(1)
    }

    console.log('✅ PreLaunch mode disabled successfully:', data)
    console.log('🎉 You can now access the normal login page and admin panel!')
    
  } catch (error) {
    console.error('💥 Script error:', error)
    process.exit(1)
  }
}

disablePreLaunch()