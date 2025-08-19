// Simple script to add missing columns to daily_email_content table
import { supabase } from './server/lib/supabase.js';

async function updateTable() {
  try {
    console.log('Testing database connection...');
    
    // First test if table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('daily_email_content')
      .select('id')
      .limit(1);
      
    if (tableError) {
      console.error('Table access error:', tableError.message);
      return;
    }
    
    console.log('Table exists, attempting to add sample record with new fields...');
    
    // Try to insert a record with new fields to see what happens
    const { data: insertResult, error: insertError } = await supabase
      .from('daily_email_content')  
      .insert({
        user_id: 'test-user-id',
        email_date: '2025-08-19',
        journal_prompt: 'Test prompt',
        goal_summary: 'Test summary', 
        business_insights: 'Test insights',
        sentiment_trend: 'Test trend',
        milestone_reminders: 'Test reminders',
        personalization_data: {},
        motivation_quote: 'Test quote',
        top_goal: '{"title": "Test goal"}',
        journal_snapshot: '{"message": "Test snapshot"}',
        business_health: '[]',
        action_nudges: '[]', 
        smart_suggestions: '[]'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Insert failed:', insertError.message);
      console.log('This likely means columns are missing. Columns need to be added manually to Supabase.');
    } else {
      console.log('Success! New columns work:', insertResult.id);
      
      // Clean up test record
      await supabase
        .from('daily_email_content')
        .delete()
        .eq('id', insertResult.id);
      console.log('Test record cleaned up');
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

updateTable();