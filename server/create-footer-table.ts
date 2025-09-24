// Script to create footer_content table in Supabase
import { supabase } from './lib/supabase.js';

async function createFooterContentTable() {
  console.log('🚀 Creating footer_content table in Supabase...');
  
  try {
    // First try to create table structure
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS footer_content (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        type VARCHAR(20) NOT NULL CHECK (type IN ('privacy', 'terms', 'contact')),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(type)
      );
      
      ALTER TABLE footer_content ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "footer_content_public_read" ON footer_content
        FOR SELECT USING (is_published = true);
        
      CREATE POLICY IF NOT EXISTS "footer_content_admin_all" ON footer_content
        FOR ALL USING (true) WITH CHECK (true);
    `;
    
    console.log('📝 Executing SQL to create table...');
    
    // Use the rpc endpoint to execute SQL
    const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });
    
    if (sqlError) {
      console.log('⚠️ SQL RPC not available, trying direct table creation...');
      
      // Try direct table creation if RPC fails
      const { data: tableData, error: tableError } = await supabase
        .from('footer_content')
        .select('count')
        .limit(1);
        
      if (tableError && tableError.code === '42P01') {
        console.log('❌ Table does not exist and cannot be created via RPC');
        console.log('Please create the table manually in Supabase SQL editor:');
        console.log(createTableSQL);
        return;
      }
    }

    console.log('✅ Table structure ready');

    // Insert default content
    console.log('📝 Inserting default content...');
    const { data: insertResult, error: insertError } = await supabase
      .from('footer_content')
      .upsert([
        {
          type: 'privacy',
          title: 'Privacy Policy',
          content: 'We are committed to protecting your privacy and ensuring the security of your personal information.',
          is_published: true
        },
        {
          type: 'terms',
          title: 'Terms of Service',
          content: 'By accessing and using Bizzin, you agree to comply with and be bound by these Terms of Service.',
          is_published: true
        },
        {
          type: 'contact',
          title: 'Contact Us',
          content: 'Get in touch with us for any questions, support needs, or feedback.',
          is_published: true
        }
      ], { onConflict: 'type' });

    if (insertError) {
      console.error('❌ Error inserting content:', insertError);
    } else {
      console.log('✅ Default content inserted');
    }

    console.log('🎉 Footer content setup complete!');
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
  }
}

createFooterContentTable();