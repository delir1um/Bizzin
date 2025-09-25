import { Pool } from 'pg';

// Extract connection details from Supabase URL to ensure we're using the same database
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Convert Supabase URL to PostgreSQL connection string
// Supabase URL format: https://[project-ref].supabase.co
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const connectionString = `postgresql://postgres.${projectRef}:${supabaseServiceKey}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

console.log('🔧 PostgreSQL client connecting to:', {
  projectRef,
  usingSupabaseConnection: true
});

// Create a PostgreSQL pool for direct database operations
// This bypasses Supabase client compatibility issues while using the same database
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export interface PendingSignupRecord {
  id: string;
  email: string;
  password_hash: string;
  referral_code?: string;
  verification_token: string;
  first_name?: string;
  last_name?: string;
  verified: boolean;
  expires_at: string;
  attempts: number;
  created_at: string;
  updated_at: string;
}

export async function insertPendingSignup(data: {
  email: string;
  password_hash: string;
  referral_code?: string;
  verification_token: string;
  first_name?: string;
  last_name?: string;
  verified: boolean;
  expires_at: string;
  attempts: number;
}): Promise<PendingSignupRecord> {
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO pending_signups (
        email, password_hash, referral_code, verification_token, 
        first_name, last_name, verified, expires_at, attempts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, password_hash, referral_code, verification_token,
                first_name, last_name, verified, expires_at, attempts,
                created_at, updated_at
    `;
    
    const values = [
      data.email,
      data.password_hash,
      data.referral_code,
      data.verification_token,
      data.first_name,
      data.last_name,
      data.verified,
      data.expires_at,
      data.attempts
    ];
    
    const result = await client.query(query, values);
    return result.rows[0] as PendingSignupRecord;
  } finally {
    client.release();
  }
}

export async function findPendingSignupByToken(token: string): Promise<PendingSignupRecord | null> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM pending_signups WHERE verification_token = $1';
    const result = await client.query(query, [token]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function deletePendingSignup(id: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('DELETE FROM pending_signups WHERE id = $1', [id]);
  } finally {
    client.release();
  }
}

export async function updatePendingSignupAttempts(id: string, attempts: number): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query(
      'UPDATE pending_signups SET attempts = $1 WHERE id = $2',
      [attempts, id]
    );
  } finally {
    client.release();
  }
}

export async function updatePendingSignupToken(id: string, newToken: string, attempts: number): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query(
      'UPDATE pending_signups SET verification_token = $1, attempts = $2 WHERE id = $3',
      [newToken, attempts, id]
    );
  } finally {
    client.release();
  }
}

export default pool;