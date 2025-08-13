const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.DATABASE_URL?.replace('postgresql://', 'https://').split('@')[1]?.split('/')[0];
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl) {
  console.log('❌ No Supabase URL found in environment');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  process.exit(1);
}

console.log('🔍 Checking recent journal entries...');

// Simple direct database query using postgres connection
const { Client } = require('pg');

async function checkEntries() {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    
    await client.connect();
    console.log('✅ Connected to database');
    
    const result = await client.query(`
      SELECT title, content, sentiment_data, created_at 
      FROM journal_entries 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📊 Recent Journal Entries Analysis:');
    console.log('='.repeat(60));
    
    result.rows.forEach((entry, index) => {
      console.log(`\n${index + 1}. "${entry.title}"`);
      console.log(`Content: ${entry.content.substring(0, 100)}...`);
      
      if (entry.sentiment_data) {
        const sentiment = JSON.parse(entry.sentiment_data);
        console.log(`Category: ${sentiment.business_category || 'N/A'}`);
        console.log(`Mood: ${sentiment.primary_mood || 'N/A'}`);
        console.log(`Energy: ${sentiment.energy || 'N/A'}`);
        console.log(`Confidence: ${sentiment.confidence || 'N/A'}%`);
        console.log(`Insights: ${sentiment.insights?.join(' | ') || 'N/A'}`);
      } else {
        console.log('❌ No sentiment data found');
      }
      console.log(`Created: ${entry.created_at}`);
    });
    
    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkEntries();