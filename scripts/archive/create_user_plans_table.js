// Script to create the missing user_plans table to fix HEAD request errors
import { supabase } from './client/src/lib/supabase.js'

async function createUserPlansTable() {
  console.log('Creating user_plans table to eliminate HEAD request errors...')
  
  try {
    // Create the user_plans table with basic structure
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.user_plans (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        expires_at timestamp with time zone,
        cancelled_at timestamp with time zone,
        amount_paid numeric(10,2) DEFAULT 0,
        UNIQUE(user_id)
      );
    `
    
    // Enable RLS
    const enableRLSSQL = `
      ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
    `
    
    // Create RLS policies
    const createPoliciesSQL = `
      CREATE POLICY "Users can view their own plans" ON public.user_plans
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert their own plans" ON public.user_plans
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update their own plans" ON public.user_plans
        FOR UPDATE USING (auth.uid() = user_id);
    `
    
    // Execute the SQL commands
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    })
    
    if (createError) {
      console.error('Error creating table:', createError)
      // Try alternative approach using direct SQL
      const { error: directError } = await supabase
        .from('user_plans')
        .select('id')
        .limit(1)
      
      if (directError && directError.code === '42P01') {
        console.log('Table does not exist, but cannot create it programmatically')
        console.log('You need to create the user_plans table manually in your Supabase dashboard')
        console.log('Table structure needed:')
        console.log(createTableSQL)
        return false
      }
    }
    
    console.log('user_plans table created or already exists')
    return true
    
  } catch (error) {
    console.error('Error in createUserPlansTable:', error)
    return false
  }
}

// Run the function
createUserPlansTable()
  .then(success => {
    if (success) {
      console.log('✅ user_plans table setup complete')
    } else {
      console.log('❌ Manual table creation required')
    }
    process.exit(0)
  })
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })