import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('Attempting to connect to database...');

const client = postgres(connectionString);
const db = drizzle(client);

async function testConnection() {
  try {
    // Test basic connection
    const result = await client`SELECT current_database(), current_user, version()`;
    console.log('✅ Database connection successful!');
    console.log('Database:', result[0].current_database);
    console.log('User:', result[0].current_user);
    console.log('Version:', result[0].version);

    // Test listing tables
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('\n📋 Available tables:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });

    // Test admin_users table specifically
    try {
      const adminCount = await client`SELECT COUNT(*) as count FROM admin_users`;
      console.log(`\n👥 Admin users count: ${adminCount[0].count}`);
    } catch (err) {
      console.log('\n⚠️ admin_users table issue:', err.message);
    }

    // Test user_profiles table specifically  
    try {
      const profileCount = await client`SELECT COUNT(*) as count FROM user_profiles`;
      console.log(`👤 User profiles count: ${profileCount[0].count}`);
    } catch (err) {
      console.log('⚠️ user_profiles table issue:', err.message);
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await client.end();
  }
}

testConnection();