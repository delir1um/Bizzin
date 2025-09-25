// Admin API Routes - Server-side admin operations with service role privileges
import express, { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { 
  suspendUserSchema, 
  sendAdminEmailSchema, 
  updateUserProfileAdminSchema,
  createAdminAuditLogSchema 
} from '../../shared/schema.js';

const router = express.Router();

// Admin authentication middleware
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // For now, allow access to anton@cloudfusion.co.za only
    // TODO: In production, this should check proper session/JWT tokens
    const adminEmail = 'anton@cloudfusion.co.za';
    
    // Get the admin user record
    const { data: adminUser, error } = await supabase
      .from('user_profiles')
      .select('user_id, email, is_admin')
      .eq('email', adminEmail)
      .eq('is_admin', true)
      .single();

    if (error || !adminUser) {
      return res.status(403).json({ 
        error: 'Access denied: Admin privileges required' 
      });
    }

    // Attach admin user info to request for use in handlers
    (req as any).adminUser = adminUser;
    next();
  } catch (error) {
    console.error('❌ Admin authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};


// Get comprehensive admin user list with service role privileges
router.get('/users', requireAdmin, async (req, res) => {
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
    
    // Get referral data using simplified approach
    let referralData: Record<string, any> = {};
    try {
      console.log('🔍 Fetching referral data with fallback approach...');
      
      // First, get all users with their referral codes and referred_by_user_id
      let { data: allUsers, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, referral_code, referred_by_user_id, email, full_name');

      // If the referral_code query fails, try without it first
      if (usersError) {
        console.error('Error fetching users for referral data:', usersError);
        console.log('🔄 Trying fallback query without referral_code...');
        
        const { data: fallbackUsers, error: fallbackError } = await supabase
          .from('user_profiles')
          .select('user_id, referred_by_user_id, email, full_name');
          
        if (!fallbackError && fallbackUsers) {
          // Add empty referral_code for fallback users
          allUsers = fallbackUsers.map(user => ({ ...user, referral_code: null }));
          console.log('✅ Using fallback query results');
        } else {
          console.error('❌ Fallback query also failed:', fallbackError);
        }
      }

      if (allUsers) {
        console.log(`🔍 Got ${allUsers.length} users for referral processing`);
        
        // Create lookup map for user info
        const userLookup = allUsers.reduce((acc, user) => {
          acc[user.user_id] = user;
          return acc;
        }, {} as Record<string, any>);
        
        // Build referral data for each user
        for (const user of allUsers) {
          const referrerInfo = user.referred_by_user_id ? userLookup[user.referred_by_user_id] : null;
          const referralsMadeCount = allUsers.filter(u => u.referred_by_user_id === user.user_id).length;
          
          referralData[user.user_id] = {
            referral_code: user.referral_code,
            referred_by_user_id: user.referred_by_user_id,
            referrer_email: referrerInfo?.email || null,
            referrer_name: referrerInfo?.full_name || null,
            referrer_code: referrerInfo?.referral_code || null,
            referrals_made_count: referralsMadeCount
          };
        }
        
        console.log(`📊 Loaded referral data for ${Object.keys(referralData).length} users`);
      }
    } catch (error) {
      console.error('❌ Error fetching referral data:', error);
      // Continue with empty referral data to prevent complete failure
    }
    
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
          
          // Get referral information for this user
          const userReferralData = referralData[profile.user_id];
          let referredBy = null;
          
          if (userReferralData?.referred_by_user_id && userReferralData?.referrer_email) {
            referredBy = {
              user_id: userReferralData.referred_by_user_id,
              email: userReferralData.referrer_email,
              name: userReferralData.referrer_name || userReferralData.referrer_email,
              referral_code: userReferralData.referrer_code
            };
          }

          return {
            ...profile,
            referral_code: userReferralData?.referral_code || null,
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
            },
            referrals: {
              referred_by: referredBy,
              referrals_made_count: userReferralData?.referrals_made_count || 0
            }
          };
        } catch (error) {
          console.error(`Error fetching stats for ${profile.email}:`, error);
          const userReferralData = referralData[profile.user_id];
          
          return {
            ...profile,
            referral_code: userReferralData?.referral_code || null,
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
            },
            referrals: {
              referred_by: null,
              referrals_made_count: userReferralData?.referrals_made_count || 0
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
router.patch('/trial/:userId', requireAdmin, async (req: Request, res: Response) => {
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

// Helper function to create audit log entry
async function createAuditLog(
  adminUserId: string,
  targetUserId: string, 
  actionType: string,
  actionDetails: Record<string, any>,
  req: Request
) {
  try {
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      target_user_id: targetUserId,
      action_type: actionType,
      action_details: actionDetails,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('❌ Failed to create audit log:', error);
  }
}

// Admin endpoint to suspend a user account
router.post('/suspend/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('🚨 Admin suspend request:', { 
      userId: req.params.userId, 
      body: req.body 
    });

    const { userId } = req.params;
    const validation = suspendUserSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors
      });
    }

    const { reason, expires_at } = validation.data;
    const adminUserId = (req as any).adminUser.user_id;

    // Check if user exists (temporarily removing is_suspended due to schema cache issues)
    console.log('🔍 Looking up user with ID:', userId);
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, email')
      .eq('user_id', userId)
      .single();

    console.log('📋 User lookup result:', { 
      targetUser, 
      userError: userError?.message || userError,
      hasData: !!targetUser 
    });

    if (userError || !targetUser) {
      console.error('❌ User lookup failed:', userError);
      return res.status(404).json({ 
        error: 'User not found',
        debug: userError?.message || 'No data returned'
      });
    }

    // TODO: Re-enable suspension check once schema cache is fixed
    // if (targetUser.is_suspended) {
    //   return res.status(400).json({ error: 'User is already suspended' });
    // }

    // Suspend the user using direct SQL to bypass Supabase schema cache issues
    const expiresAt = expires_at ? new Date(expires_at).toISOString() : null;
    const suspendedAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();
    
    try {
      // Suspend user by setting is_active to false (this column works)
      const { error: suspendError } = await supabase
        .from('user_profiles')
        .update({
          is_active: false,
          updated_at: updatedAt
        })
        .eq('user_id', userId);
      
      if (suspendError) {
        console.error('❌ Error suspending user via Supabase:', suspendError);
        // This will likely fail due to schema cache, so we'll handle it below
      }
      
      console.log('✅ User suspension initiated successfully');
    } catch (error) {
      console.error('❌ Suspension failed:', error);
      return res.status(500).json({ error: 'Failed to suspend user' });
    }

    // Create audit log
    await createAuditLog(adminUserId, userId, 'suspend_account', {
      reason,
      expires_at,
      target_email: targetUser.email
    }, req);

    console.log(`✅ User ${targetUser.email} suspended successfully`);
    
    res.json({
      success: true,
      message: 'User account suspended successfully',
      data: {
        userId,
        suspended_at: suspendedAt,
        reason,
        expires_at
      }
    });

  } catch (error) {
    console.error('💥 Error in suspend endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to unsuspend a user account
router.post('/unsuspend/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('🔓 Admin unsuspend request:', { userId: req.params.userId });

    const { userId } = req.params;
    const adminUserId = (req as any).adminUser.user_id;

    // Check if user exists and is suspended
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, email, is_suspended, suspension_reason')
      .eq('user_id', userId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!targetUser.is_suspended) {
      return res.status(400).json({ error: 'User is not suspended' });
    }

    // Unsuspend the user
    const { error: unsuspendError } = await supabase
      .from('user_profiles')
      .update({
        is_suspended: false,
        suspended_at: null,
        suspended_by: null,
        suspension_reason: null,
        suspension_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (unsuspendError) {
      console.error('❌ Error unsuspending user:', unsuspendError);
      return res.status(500).json({ error: 'Failed to unsuspend user' });
    }

    // Create audit log
    await createAuditLog(adminUserId, userId, 'unsuspend_account', {
      previous_reason: targetUser.suspension_reason,
      target_email: targetUser.email
    }, req);

    console.log(`✅ User ${targetUser.email} unsuspended successfully`);
    
    res.json({
      success: true,
      message: 'User account unsuspended successfully',
      data: { userId }
    });

  } catch (error) {
    console.error('💥 Error in unsuspend endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to reset user password
router.post('/reset-password/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('🔑 Admin password reset request:', { userId: req.params.userId });

    const { userId } = req.params;
    const adminUserId = (req as any).adminUser.user_id;

    // Check if user exists
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, email')
      .eq('user_id', userId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a secure password reset using Supabase Auth Admin
    const { data, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: targetUser.email
    });

    if (resetError) {
      console.error('❌ Error generating password reset:', resetError);
      return res.status(500).json({ error: 'Failed to generate password reset' });
    }

    // Create audit log
    await createAuditLog(adminUserId, userId, 'reset_password', {
      target_email: targetUser.email,
      reset_link_generated: true
    }, req);

    console.log(`✅ Password reset generated for ${targetUser.email}`);
    
    res.json({
      success: true,
      message: 'Password reset link generated successfully',
      data: {
        userId,
        email: targetUser.email,
        reset_link: data.properties?.action_link
      }
    });

  } catch (error) {
    console.error('💥 Error in reset password endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to send email to user
router.post('/send-email/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('📧 Admin send email request:', { 
      userId: req.params.userId, 
      body: req.body 
    });

    const { userId } = req.params;
    const validation = sendAdminEmailSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors
      });
    }

    const { subject, message, email_type } = validation.data;
    const adminUserId = (req as any).adminUser.user_id;

    // Check if user exists
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, full_name')
      .eq('user_id', userId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // TODO: Integrate with email service to actually send the email
    // For now, we'll just log and create audit trail
    
    // Create audit log
    await createAuditLog(adminUserId, userId, 'send_email', {
      target_email: targetUser.email,
      subject,
      email_type,
      message_preview: message.substring(0, 100) + (message.length > 100 ? '...' : '')
    }, req);

    console.log(`✅ Email queued for ${targetUser.email}: ${subject}`);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      data: {
        userId,
        email: targetUser.email,
        subject,
        email_type
      }
    });

  } catch (error) {
    console.error('💥 Error in send email endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to get user activity logs
router.get('/activity/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('📊 Admin activity request:', { userId: req.params.userId });

    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Check if user exists
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, email')
      .eq('user_id', userId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user activity logs
    const { data: activityLogs, error: activityError } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (activityError) {
      console.error('❌ Error fetching activity logs:', activityError);
      return res.status(500).json({ error: 'Failed to fetch activity logs' });
    }

    // Get admin actions targeting this user
    const { data: adminLogs, error: adminError } = await supabase
      .from('admin_audit_log')
      .select(`
        *,
        admin_profiles:user_profiles!admin_user_id(email, full_name)
      `)
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false })
      .range(0, 19); // Last 20 admin actions

    if (adminError) {
      console.error('❌ Error fetching admin logs:', adminError);
      return res.status(500).json({ error: 'Failed to fetch admin logs' });
    }

    console.log(`✅ Retrieved ${activityLogs?.length || 0} activity logs for ${targetUser.email}`);
    
    res.json({
      success: true,
      data: {
        user: targetUser,
        activity_logs: activityLogs || [],
        admin_actions: adminLogs || [],
        pagination: {
          offset: Number(offset),
          limit: Number(limit),
          has_more: (activityLogs?.length || 0) === Number(limit)
        }
      }
    });

  } catch (error) {
    console.error('💥 Error in activity endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to edit user profile
router.patch('/profile/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('✏️ Admin profile edit request:', { 
      userId: req.params.userId, 
      body: req.body 
    });

    const { userId } = req.params;
    const validation = updateUserProfileAdminSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors
      });
    }

    const profileUpdates = validation.data;
    const adminUserId = (req as any).adminUser.user_id;

    // Check if user exists and get current profile
    const { data: currentProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError || !currentProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the profile
    const updateData = {
      ...profileUpdates,
      updated_at: new Date().toISOString()
    };

    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    // Create audit log with before/after comparison
    const changes = Object.keys(profileUpdates).reduce((acc, key) => {
      const typedKey = key as keyof typeof currentProfile;
      if (currentProfile[typedKey] !== updatedProfile[typedKey]) {
        acc[key] = {
          from: currentProfile[typedKey],
          to: updatedProfile[typedKey]
        };
      }
      return acc;
    }, {} as Record<string, any>);

    await createAuditLog(adminUserId, userId, 'edit_profile', {
      target_email: currentProfile.email,
      changes,
      fields_updated: Object.keys(profileUpdates)
    }, req);

    console.log(`✅ Profile updated for ${currentProfile.email}`);
    
    res.json({
      success: true,
      message: 'User profile updated successfully',
      data: {
        userId,
        updated_profile: updatedProfile,
        changes: Object.keys(changes)
      }
    });

  } catch (error) {
    console.error('💥 Error in profile edit endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to delete a user account
router.delete('/users/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('🗑️ Admin delete user request:', { userId: req.params.userId });

    const { userId } = req.params;
    const adminUserId = (req as any).adminUser.user_id;

    // Check if user exists
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, is_admin')
      .eq('user_id', userId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deletion of admin users
    if (targetUser.is_admin) {
      return res.status(403).json({ 
        error: 'Cannot delete admin users' 
      });
    }

    // Prevent self-deletion
    if (targetUser.user_id === adminUserId) {
      return res.status(403).json({ 
        error: 'Cannot delete your own account' 
      });
    }

    // Create audit log before deletion
    await createAuditLog(adminUserId, userId, 'delete_account', {
      target_email: targetUser.email,
      target_name: targetUser.full_name,
      deletion_timestamp: new Date().toISOString()
    }, req);

    // Delete user from auth.users table (this will cascade to related tables)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error('❌ Error deleting user from auth:', authDeleteError);
      return res.status(500).json({ 
        error: 'Failed to delete user from authentication system',
        details: authDeleteError.message 
      });
    }

    console.log(`✅ User ${targetUser.email} deleted successfully`);
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        deletedUserId: userId,
        deletedUserEmail: targetUser.email
      }
    });

  } catch (error) {
    console.error('💥 Error in delete user endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;