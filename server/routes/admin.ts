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
    console.log('👥 Fetching complete admin user list with fixed plan logic...');
    
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
    
    // Get ALL user plans using direct SQL to avoid Supabase client issues
    let allPlans: any[] = [];
    try {
      // First try direct database access via SQL
      const { data: planData, error: plansError } = await supabase
        .from('user_plans')
        .select('user_id, plan_type, expires_at, created_at, cancelled_at, is_trial, trial_ends_at')
        .order('created_at', { ascending: false });
      
      if (plansError) {
        console.error('Error fetching plans:', plansError);
        // Try without problematic columns as fallback
        const { data: fallbackPlans, error: fallbackError } = await supabase
          .from('user_plans')  
          .select('user_id, plan_type, expires_at, created_at')
          .order('created_at', { ascending: false });
        
        allPlans = fallbackPlans || [];
        console.log('Using fallback plan query without cancelled_at');
      } else {
        allPlans = planData || [];
      }
    } catch (err) {
      console.error('Plan query failed completely:', err);
      allPlans = [];
    }

    console.log(`📊 Found ${allPlans?.length || 0} plan records total`);
    
    // Get additional stats for each user and match with plan data
    const usersWithStatsAndPlans = await Promise.all(
      (profiles || []).map(async (profile) => {
        try {
          // Find user's plan from the pre-fetched plans
          const userPlan = allPlans?.find(plan => plan.user_id === profile.user_id);
          
          console.log(`🔍 Plan lookup for ${profile.email}:`, {
            user_id: profile.user_id,
            found_plan: !!userPlan,
            plan_details: userPlan
          });
          
          // Get user stats
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
          
          // Calculate plan information
          let planType: 'trial' | 'premium' = 'trial';
          let planStatus: 'active' | 'cancelled' | 'expired' = 'active';
          let trialDaysRemaining = null;
          let paidMemberDuration = null;
          let isTrial = true;
          
          if (userPlan) {
            const now = new Date();
            const expiresAt = userPlan.expires_at ? new Date(userPlan.expires_at) : null;
            const planCreatedAt = userPlan.created_at ? new Date(userPlan.created_at) : null;
            
            console.log(`✅ Processing plan for ${profile.email}:`, {
              plan_type: userPlan.plan_type,
              expires_at: userPlan.expires_at,
              now: now.toISOString()
            });
            
            if (userPlan.plan_type === 'premium') {
              planType = 'premium';
              isTrial = false;
              if (planCreatedAt) {
                paidMemberDuration = Math.floor((now.getTime() - planCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
              }
            } else if (userPlan.plan_type === 'free' && expiresAt) {
              planType = 'trial';
              isTrial = true;
              if (expiresAt > now) {
                trialDaysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              } else {
                trialDaysRemaining = 0;
                planStatus = 'expired';
              }
              console.log(`📅 Trial calculation for ${profile.email}:`, {
                trialDaysRemaining,
                planStatus,
                expires_at: expiresAt.toISOString(),
                days_diff: Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              });
            }
            
            // Check if plan is cancelled (if data is available)
            if (userPlan.cancelled_at) {
              planStatus = 'cancelled';
            }
          } else {
            console.log(`❌ No plan found for ${profile.email}, using default trial`);
          }
          
          return {
            ...profile,
            plan: {
              plan_type: planType,
              plan_status: planStatus,
              expires_at: userPlan?.expires_at || null,
              trial_days_remaining: trialDaysRemaining,
              paid_member_duration: paidMemberDuration,
              is_trial: isTrial
            },
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
            plan: {
              plan_type: 'trial' as const,
              plan_status: 'active' as const,
              expires_at: null,
              trial_days_remaining: null,
              paid_member_duration: null,
              is_trial: true
            },
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
      users: usersWithStatsAndPlans,
      totalUsers: usersWithStatsAndPlans.length
    });
    
  } catch (error) {
    console.error('💥 Error fetching admin users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin users',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Admin endpoint to update trial days for a user
router.patch('/trial/:userId', async (req: Request, res: Response) => {
  try {
    console.log('🔧 Admin trial update request:', { 
      userId: req.params.userId, 
      body: req.body 
    });

    const { userId } = req.params
    const { daysToAdd } = req.body

    if (!userId || typeof daysToAdd !== 'number') {
      return res.status(400).json({ 
        error: 'Missing required fields: userId and daysToAdd (number)' 
      })
    }

    // Get the current user plan using service role
    const { data: userPlans, error: fetchError } = await supabase
      .from('user_plans')
      .select('id, expires_at, plan_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    console.log('📋 Service role plan fetch:', { userPlans, fetchError });

    if (fetchError) {
      console.error('❌ Error fetching user plan with service role:', fetchError);
      return res.status(500).json({ 
        error: `Failed to fetch user plan: ${fetchError.message}` 
      });
    }

    const userPlan = userPlans?.[0]
    if (!userPlan) {
      console.error('❌ No user plan found for user:', userId);
      return res.status(404).json({ 
        error: 'No user plan found for this user' 
      });
    }

    console.log('📅 Found user plan via service role:', userPlan);

    const now = new Date()
    let baseDate: Date

    // Determine base date: use current expiry if still valid, otherwise use now
    if (userPlan.expires_at) {
      const currentExpiry = new Date(userPlan.expires_at)
      baseDate = currentExpiry > now ? currentExpiry : now
    } else {
      baseDate = now
    }

    // Add the days to the base date
    const newExpiryDate = new Date(baseDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000))
    
    console.log('🔄 Trial calculation:', { 
      baseDate: baseDate.toISOString(), 
      daysToAdd, 
      newExpiryDate: newExpiryDate.toISOString() 
    });

    // Validate the new date (prevent setting expiry too far in past)
    if (newExpiryDate < new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000))) {
      return res.status(400).json({ 
        error: 'Cannot set expiry more than 1 year in the past' 
      });
    }

    // Update the specific plan record using service role
    const { data: updateData, error: updateError } = await supabase
      .from('user_plans')
      .update({ 
        expires_at: newExpiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userPlan.id)
      .select()

    console.log('💾 Service role update result:', { updateData, updateError });

    if (updateError) {
      console.error('❌ Update error with service role:', updateError);
      return res.status(500).json({ 
        error: `Failed to update trial: ${updateError.message}` 
      });
    }

    console.log('✅ Admin trial update successful!');
    
    res.json({
      success: true,
      message: 'Trial days updated successfully',
      data: {
        userId,
        previousExpiry: userPlan.expires_at,
        newExpiry: newExpiryDate.toISOString(),
        daysAdded: daysToAdd
      }
    })

  } catch (error) {
    console.error('❌ Admin trial update failed:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
});

export default router;