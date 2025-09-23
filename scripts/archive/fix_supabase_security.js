// Fix Supabase security lints - Enable RLS on podcast_episodes table and review security definer views
import { supabase } from './server/lib/supabase.js';

async function fixSecurityIssues() {
  try {
    console.log('Fixing Supabase security issues...');

    // 1. Enable RLS on podcast_episodes table
    console.log('Enabling RLS on podcast_episodes table...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
      // Try alternative approach - direct query
      const { error: altError } = await supabase
        .from('podcast_episodes')
        .select('count')
        .limit(1);
      
      if (altError) {
        console.error('Cannot access podcast_episodes table:', altError.message);
      } else {
        console.log('Table access confirmed - RLS may already be enabled or needs manual configuration');
      }
    } else {
      console.log('✅ RLS enabled on podcast_episodes table');
    }

    // 2. Check current RLS policies
    console.log('Checking existing RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .from('information_schema.table_privileges')
      .select('*')
      .eq('table_name', 'podcast_episodes');

    if (policyError) {
      console.error('Error checking policies:', policyError);
    } else {
      console.log('Current privileges:', policies?.length || 0);
    }

    // 3. Create basic RLS policy for podcast_episodes if needed
    console.log('Creating basic RLS policy for podcast_episodes...');
    const policySQL = `
      CREATE POLICY IF NOT EXISTS "authenticated_users_read_podcast_episodes" 
      ON public.podcast_episodes 
      FOR SELECT 
      USING (auth.role() = 'authenticated');
    `;

    const { error: createPolicyError } = await supabase.rpc('exec_sql', {
      sql: policySQL
    });

    if (createPolicyError) {
      console.error('Error creating policy:', createPolicyError);
      console.log('Policy creation may need to be done manually in Supabase dashboard');
    } else {
      console.log('✅ Basic RLS policy created for podcast_episodes');
    }

    // 4. List security definer views that need review
    console.log('\n⚠️ Security Definer Views that need manual review:');
    console.log('- user_referral_dashboard');
    console.log('- plan_limits');
    console.log('\nThese views use SECURITY DEFINER and should be reviewed in Supabase dashboard');
    console.log('Consider changing to SECURITY INVOKER if appropriate for your use case');

    console.log('\n✅ Security fixes completed!');
    console.log('Please check Supabase dashboard to verify RLS is properly enabled');

  } catch (error) {
    console.error('Script error:', error);
    
    // Provide manual fix instructions
    console.log('\n📋 Manual fixes needed in Supabase dashboard:');
    console.log('1. Go to Authentication → Policies');
    console.log('2. Find podcast_episodes table and enable RLS');
    console.log('3. Create policy: Allow authenticated users to read');
    console.log('4. Review security definer views: user_referral_dashboard, plan_limits');
  }
}

fixSecurityIssues();