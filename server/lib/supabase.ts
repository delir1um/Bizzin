// Supabase client for server-side operations
import { createClient } from '@supabase/supabase-js';

// PRODUCTION FIX: Force correct database connection
const supabaseUrl = process.env.VITE_SUPABASE_URL!; // Use same as frontend
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL environment variable is required for server');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for server');
}

// Extract project reference for verification
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('🔧 Server Supabase config:', { 
  projectRef,
  url: supabaseUrl?.substring(0, 30) + '...', 
  hasServiceKey: !!supabaseServiceKey,
  usingCorrectUrl: !!process.env.VITE_SUPABASE_URL
});

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  global: {
    headers: {
      'X-Skip-Schema-Cache': 'true',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'X-Force-Schema-Refresh': 'true'
    }
  },
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false
  }
});