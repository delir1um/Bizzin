import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import pg from 'pg';

const MIGRATIONS_DIR = process.argv[2] || 'database/migrations';

const { Client } = pg;
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`Applying ${file}...`);
    await client.query(sql);
  }
  await client.end();
  console.log('Done');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
