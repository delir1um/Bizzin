// Supabase client for server-side operations
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

console.log('🔧 Server Supabase config:', { 
  url: supabaseUrl?.substring(0, 30) + '...', 
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  hasUrl: !!supabaseUrl 
});

export const supabase = createClient(supabaseUrl, supabaseServiceKey);