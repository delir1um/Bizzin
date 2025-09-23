// Add enhanced digest columns to daily_email_content table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addEnhancedColumns() {
  try {
    console.log('Adding enhanced digest columns to daily_email_content table...');
    
    // Add the new columns
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE daily_email_content 
        ADD COLUMN IF NOT EXISTS motivation_quote TEXT,
        ADD COLUMN IF NOT EXISTS top_goal TEXT,
        ADD COLUMN IF NOT EXISTS journal_snapshot TEXT,
        ADD COLUMN IF NOT EXISTS business_health TEXT,
        ADD COLUMN IF NOT EXISTS action_nudges TEXT,
        ADD COLUMN IF NOT EXISTS smart_suggestions TEXT;
      `
    });

    if (error) {
      console.error('Error adding columns:', error);
      // Try direct approach
      const alterQueries = [
        'ALTER TABLE daily_email_content ADD COLUMN IF NOT EXISTS motivation_quote TEXT',
        'ALTER TABLE daily_email_content ADD COLUMN IF NOT EXISTS top_goal TEXT', 
        'ALTER TABLE daily_email_content ADD COLUMN IF NOT EXISTS journal_snapshot TEXT',
        'ALTER TABLE daily_email_content ADD COLUMN IF NOT EXISTS business_health TEXT',
        'ALTER TABLE daily_email_content ADD COLUMN IF NOT EXISTS action_nudges TEXT',
        'ALTER TABLE daily_email_content ADD COLUMN IF NOT EXISTS smart_suggestions TEXT'
      ];
      
      for (const query of alterQueries) {
        const { error: altError } = await supabase.rpc('execute_sql', { sql: query });
        if (altError) {
          console.error(`Error with query "${query}":`, altError);
        } else {
          console.log(`Successfully executed: ${query}`);
        }
      }
    } else {
      console.log('Successfully added all enhanced digest columns!');
    }

    // Verify columns exist
    const { data: columns, error: selectError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'daily_email_content')
      .order('ordinal_position');

    if (selectError) {
      console.error('Error checking columns:', selectError);
    } else {
      console.log('\nCurrent daily_email_content columns:');
      columns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable ? 'nullable' : 'not null'})`);
      });
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

addEnhancedColumns();