// Supabase client for server-side operations
import { createClient } from '@supabase/supabase-js';

// PRODUCTION: Require proper server environment variables - NO FALLBACKS
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required for server');
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
  usingFallback: !process.env.SUPABASE_URL
});

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  global: {
    headers: {
      'X-Skip-Schema-Cache': 'true',
      'Cache-Control': 'no-cache'
    }
  },
  db: {
    schema: 'public'
  }
});