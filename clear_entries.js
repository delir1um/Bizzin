// Quick script to clear all entries for testing
import { supabase } from './client/src/lib/supabase.js'

async function clearEntries() {
  try {
    const userId = '9502ea97-1adb-4115-ba05-1b6b1b5fa721'
    
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('user_id', userId)
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('All entries cleared successfully')
    }
  } catch (err) {
    console.error('Error clearing entries:', err)
  }
}

clearEntries()