// Admin API Routes - Server-side admin operations with service role privileges
import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Fix split-brain database issue by syncing auth.users with user_profiles
router.post('/fix-database', async (req, res) => {
  try {
    console.log('🔧 Starting database fix with service role privileges...');
    
    // 1. Get all users from auth.users (service role can access this)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return res.status(500).json({ error: 'Failed to access auth users' });
    }
    
    console.log('👥 Auth users found:', authUsers.users.map(u => u.email));
    
    // 2. Get all users from user_profiles
    const { data: profileUsers, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name');
    
    if (profileError) {
      console.error('Error fetching profile users:', profileError);
      return res.status(500).json({ error: 'Failed to access user profiles' });
    }
    
    console.log('📋 Profile users found:', profileUsers?.map(u => u.email) || []);
    
    // 3. Find users in auth.users but missing from user_profiles
    const missingProfiles = authUsers.users.filter(authUser => 
      !profileUsers?.find(profile => profile.user_id === authUser.id)
    );
    
    console.log('🔍 Missing profiles for:', missingProfiles.map(u => u.email));
    
    // 4. Create missing profiles
    const createdProfiles = [];
    for (const authUser of missingProfiles) {
      const profileData = {
        user_id: authUser.id,
        email: authUser.email,
        first_name: authUser.user_metadata?.first_name || 
                   authUser.email?.split('@')[0] || 'User',
        last_name: authUser.user_metadata?.last_name || '',
        full_name: authUser.user_metadata?.full_name || 
                  `${authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'User'} ${authUser.user_metadata?.last_name || ''}`.trim(),
        business_name: authUser.user_metadata?.business_name || 
                      authUser.email?.split('@')[1]?.split('.')[0] || '',
        is_admin: false,
        is_active: true,
        created_at: authUser.created_at,
        updated_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert(profileData);
      
      if (insertError) {
        console.error(`Error creating profile for ${authUser.email}:`, insertError);
      } else {
        console.log(`✅ Created profile for ${authUser.email}`);
        createdProfiles.push(authUser.email);
      }
    }
    
    // 5. Update existing profiles with better data
    const updatedProfiles = [];
    for (const authUser of authUsers.users) {
      const existingProfile = profileUsers?.find(p => p.user_id === authUser.id);
      
      if (existingProfile && (!existingProfile.full_name || existingProfile.full_name === existingProfile.email)) {
        const updateData = {
          first_name: authUser.user_metadata?.first_name || 
                     authUser.email?.split('@')[0] || 'User',
          last_name: authUser.user_metadata?.last_name || '',
          full_name: authUser.user_metadata?.full_name || 
                    `${authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'User'} ${authUser.user_metadata?.last_name || ''}`.trim(),
          business_name: authUser.user_metadata?.business_name || 
                        (existingProfile as any)?.business_name ||
                        authUser.email?.split('@')[1]?.split('.')[0] || '',
          updated_at: new Date().toISOString()
        };
        
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', authUser.id);
        
        if (updateError) {
          console.error(`Error updating profile for ${authUser.email}:`, updateError);
        } else {
          console.log(`✅ Updated profile for ${authUser.email}`);
          updatedProfiles.push(authUser.email);
        }
      }
    }
    
    console.log('🎉 Database fix completed successfully');
    
    res.json({
      success: true,
      message: 'Database synchronization completed',
      authUsersCount: authUsers.users.length,
      profileUsersCount: profileUsers?.length || 0,
      createdProfiles,
      updatedProfiles,
      totalFixed: createdProfiles.length + updatedProfiles.length
    });
    
  } catch (error) {
    console.error('💥 Database fix failed:', error);
    res.status(500).json({ 
      error: 'Database fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get comprehensive admin user list with service role privileges
router.get('/users', async (req, res) => {
  try {
    console.log('👥 Fetching complete admin user list...');
    
    // Get all user profiles with service role privileges (bypasses RLS)
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        email,
        full_name,
        first_name,
        last_name,
        business_name,
        is_admin,
        is_active,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
    
    if (profileError) {
      console.error('Error fetching user profiles:', profileError);
      return res.status(500).json({ error: 'Failed to fetch user profiles' });
    }
    
    console.log(`📋 Found ${profiles?.length || 0} user profiles`);
    
    // Get additional stats for each user (goals, journal entries, etc.)
    const usersWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        try {
          // Get user stats in parallel
          const [
            { count: journalCount },
            { count: goalCount }, 
            { count: completedGoals },
            { count: documentCount }
          ] = await Promise.all([
            supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('user_id', profile.user_id),
            supabase.from('goals').select('*', { count: 'exact', head: true }).eq('user_id', profile.user_id),
            supabase.from('goals').select('*', { count: 'exact', head: true }).eq('user_id', profile.user_id).eq('status', 'completed'),
            supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', profile.user_id)
          ]);
          
          return {
            ...profile,
            stats: {
              journal_entries: journalCount || 0,
              total_goals: goalCount || 0,
              completed_goals: completedGoals || 0,
              documents: documentCount || 0
            }
          };
        } catch (error) {
          console.error(`Error fetching stats for ${profile.email}:`, error);
          return {
            ...profile,
            stats: {
              journal_entries: 0,
              total_goals: 0,
              completed_goals: 0,
              documents: 0
            }
          };
        }
      })
    );
    
    res.json({
      success: true,
      users: usersWithStats,
      totalUsers: usersWithStats.length
    });
    
  } catch (error) {
    console.error('💥 Error fetching admin users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin users',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;