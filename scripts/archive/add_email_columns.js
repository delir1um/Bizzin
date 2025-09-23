// Add enhanced content columns to daily_email_content table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://giahpkiwivxpocikndix.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addEmailColumns() {
  try {
    console.log('Adding enhanced email content columns...');
    
    const queries = [
      `ALTER TABLE daily_email_content ADD COLUMN IF NOT EXISTS actionable_insights TEXT;`,
      `ALTER TABLE daily_email_content ADD COLUMN IF NOT EXISTS gamification_data TEXT;`,
      `ALTER TABLE daily_email_content ADD COLUMN IF NOT EXISTS weekly_challenge TEXT;`,
      `ALTER TABLE daily_email_content ADD COLUMN IF NOT EXISTS smart_recommendations TEXT;`
    ];

    for (const query of queries) {
      const { error } = await supabase.rpc('execute_sql', { sql_query: query });
      if (error) {
        console.error('Error executing query:', query, error);
      } else {
        console.log('Successfully executed:', query);
      }
    }

    console.log('All columns added successfully!');
  } catch (error) {
    console.error('Error adding columns:', error);
  }
}

addEmailColumns();