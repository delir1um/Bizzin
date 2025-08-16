// Manual database setup - Add progress_type column to goals table
// Run this with: node add_progress_type_column.js

import pkg from 'pg';
const { Client } = pkg;

async function addProgressTypeColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add progress_type column if it doesn't exist
    await client.query(`
      ALTER TABLE goals 
      ADD COLUMN IF NOT EXISTS progress_type VARCHAR(20) DEFAULT 'manual' 
      CHECK (progress_type IN ('manual', 'milestone'));
    `);
    console.log('✅ Added progress_type column to goals table');

    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'goals' AND column_name = 'progress_type';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Column verified:', result.rows[0]);
    } else {
      console.log('❌ Column not found after creation');
    }

  } catch (error) {
    console.error('Error adding progress_type column:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

addProgressTypeColumn();