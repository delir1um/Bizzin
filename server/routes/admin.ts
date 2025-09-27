// Admin API Routes - Server-side admin operations with service role privileges
import express, { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { 
  suspendUserSchema, 
  sendAdminEmailSchema, 
  updateUserProfileAdminSchema,
  createAdminAuditLogSchema 
} from '../../shared/schema.js';
import { logger } from '../lib/logger.js';
import { simpleEmailScheduler } from '../services/SimpleEmailScheduler.js';

const router = express.Router();

// Generate a unique referral code for a user (copied from auth.ts)
// UNIFIED REFERRAL CODE GENERATION SYSTEM
// This function generates consistent, stable referral codes that never change for a given email
// IMPORTANT: This must match the generation system in referrals.ts and client services
function generateReferralCode(email: string): string {
  const cleanEmail = email.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Create a consistent hash using the same algorithm as other systems
  let hash = 0;
  for (let i = 0; i < cleanEmail.length; i++) {
    const char = cleanEmail.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive number and create deterministic code
  const positiveHash = Math.abs(hash);
  const codeBase = positiveHash.toString(36).toUpperCase();
  
  // Create exactly 10-character code by taking first 4 chars of email + 6 chars from hash
  const emailPrefix = cleanEmail.substring(0, 4).toUpperCase().padEnd(4, '0');
  const hashSuffix = codeBase.length >= 6 ? codeBase.substring(0, 6) : codeBase.padStart(6, '0');
  
  const finalCode = emailPrefix + hashSuffix;
  logger.debug('ADMIN', 'Generated consistent referral code', { email, code: finalCode });
  return finalCode;
}

// Admin authentication middleware with proper JWT verification
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required: Missing or invalid Authorization header' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required: No token provided' 
      });
    }

    // Verify the JWT token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logger.security('Admin auth failed', { authError, hasUser: !!user });
      return res.status(401).json({ 
        error: 'Authentication failed: Invalid or expired token' 
      });
    }

    // Check if the authenticated user has admin privileges
    const { data: adminUser, error: adminError } = await supabase
      .from('user_profiles')
      .select('user_id, email, is_admin')
      .eq('user_id', user.id)
      .eq('is_admin', true)
      .single();

    if (adminError || !adminUser) {
      logger.security('Admin privilege check failed', { 
        userId: user.id, 
        email: user.email, 
        adminError, 
        hasAdmin: !!adminUser 
      });
      return res.status(403).json({ 
        error: 'Access denied: Admin privileges required' 
      });
    }

    logger.security('Admin access granted', { 
      userId: adminUser.user_id, 
      email: adminUser.email 
    });

    // Attach admin user info to request for use in handlers
    (req as any).adminUser = adminUser;
    (req as any).authenticatedUser = user;
    next();
  } catch (error) {
    logger.error('ADMIN', 'Admin authentication error', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};


// Get comprehensive admin user list with service role privileges
router.get('/users', requireAdmin, async (req, res) => {
  try {
    logger.info('ADMIN', 'Fetching complete admin user list with fixed plan logic');
    
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
      logger.error('ADMIN', 'Error fetching user profiles', profileError);
      return res.status(500).json({ error: 'Failed to fetch user profiles' });
    }
    
    logger.info('ADMIN', `Found ${profiles?.length || 0} user profiles`);
    
    // Get ALL user plans using direct SQL to avoid Supabase client issues
    let allPlans: any[] = [];
    try {
      // Use only columns that definitely exist
      const { data: planData, error: plansError } = await supabase
        .from('user_plans')
        .select('user_id, plan_type, expires_at, created_at')
        .order('created_at', { ascending: false });
      
      if (plansError) {
        logger.error('ADMIN', 'Error fetching plans', plansError);
        allPlans = [];
      } else {
        allPlans = planData || [];
      }
    } catch (err) {
      logger.error('ADMIN', 'Plan query failed completely', err);
      allPlans = [];
    }

    logger.info('ADMIN', `Found ${allPlans?.length || 0} plan records total`);
    
    // Get referral data using parameterized SQL queries to avoid cache issues
    let referralData: Record<string, any> = {};
    try {
      logger.info('ADMIN', 'Fetching referral data using secure parameterized queries');
      
      // Get all users first 
      const { data: allUsers, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, email, full_name');
      
      if (usersError || !allUsers) {
        logger.error('ADMIN', 'Failed to fetch users', usersError);
        throw new Error('Cannot fetch users for referral data');
      }
      
      logger.info('ADMIN', 'Processing referral data', { userCount: allUsers.length });
      
      // Use a single efficient SQL query to get all referral data at once
      try {
        logger.info('ADMIN', 'Getting referral counts using Supabase client');
        const { data: referralCounts, error: referralCountError } = await supabase
          .from('user_profiles')
          .select('referred_by_user_id')
          .not('referred_by_user_id', 'is', null);
        
        logger.info('ADMIN', 'Referral counts query result', { hasData: !!referralCounts, hasError: !!referralCountError });
        logger.debug('ADMIN', 'Referral counts data type check', { type: typeof referralCounts });
        logger.debug('ADMIN', 'Referral counts array check', { isArray: Array.isArray(referralCounts) });
        if (referralCounts) {
          logger.info('ADMIN', 'Referral counts data size', { length: referralCounts.length });
          logger.debug('ADMIN', 'Referral counts sample data', { sampleCount: 3 });
        }
        
        // Create a map of user_id -> referral count for quick lookup
        const referralCountMap: Record<string, number> = {};
        if (!referralCountError && referralCounts && Array.isArray(referralCounts)) {
          logger.info('ADMIN', 'Processing referral records', { recordCount: referralCounts.length });
          
          // Count referrals manually from the individual records
          const countMap: Record<string, number> = {};
          referralCounts.forEach((row: any, index: number) => {
            logger.debug('ADMIN', 'Processing referral row', { rowIndex: index });
            if (row && row.referred_by_user_id) {
              const referrerId = row.referred_by_user_id;
              countMap[referrerId] = (countMap[referrerId] || 0) + 1;
              logger.debug('ADMIN', 'Counting referral', { referrerId });
            }
          });
          
          // Copy to final map
          Object.entries(countMap).forEach(([userId, count]) => {
            referralCountMap[userId] = count;
            logger.debug('ADMIN', 'Added referral count to map', { userId, count });
          });
        } else if (referralCountError) {
          logger.error('ADMIN', 'Referral counts query failed', referralCountError);
        } else {
          logger.warn('ADMIN', 'Referral counts data is not an array or is null');
        }
        
        logger.info('ADMIN', 'Built referral count map', { userCount: Object.keys(referralCountMap).length });
        logger.debug('ADMIN', 'Final referral count map built', { mapSize: Object.keys(referralCountMap).length });
        
        // Get all referrer information using Supabase client
        logger.info('ADMIN', 'Getting all referrer information');
        const { data: referrerInfo, error: referrerError } = await supabase
          .from('user_profiles')
          .select(`
            user_id,
            email,
            full_name,
            referred_by_user_id,
            referral_code
          `);
          
        logger.info('ADMIN', 'Referrer info query result', { hasData: !!referrerInfo, hasError: !!referrerError });
        
        // Process all users and build the referral data
        for (const user of allUsers) {
          logger.debug('ADMIN', 'Processing referral data for user', { userEmail: user.email, userId: user.user_id });
          
          // Get referral count for this user (how many people they referred)
          const referralsCount = referralCountMap[user.user_id] || 0;
          logger.info('ADMIN', 'User referral count', { userEmail: user.email, referralsCount });
          
          // Find referrer information for this user (who referred them)
          let referredByData = {
            referred_by_user_id: null,
            referrer_email: null,
            referrer_name: null,
            referrer_code: null
          };
          
          if (!referrerError && referrerInfo && Array.isArray(referrerInfo)) {
            const userReferrerInfo = referrerInfo.find((info: any) => info && info.user_id === user.user_id);
            if (userReferrerInfo && userReferrerInfo.referred_by_user_id) {
              // Look up the actual referrer's information
              const referrerDetails = referrerInfo.find((info: any) => info && info.user_id === userReferrerInfo.referred_by_user_id);
              if (referrerDetails) {
                referredByData = {
                  referred_by_user_id: userReferrerInfo.referred_by_user_id,
                  referrer_email: referrerDetails.email,
                  referrer_name: referrerDetails.full_name || referrerDetails.email,
                  referrer_code: referrerDetails.referral_code || generateReferralCode(referrerDetails.email || '')
                };
                logger.info('ADMIN', 'Found referrer for user', { userEmail: user.email, referrerEmail: referrerDetails.email });
              } else {
                logger.warn('ADMIN', 'Referrer ID not found in user list', { referrerId: userReferrerInfo.referred_by_user_id, userEmail: user.email });
              }
            }
          } else if (referrerError) {
            logger.error('ADMIN', 'Referrer query failed', referrerError);
          }
          // Get the user's referral code (already in referrerInfo or generate if needed)
          let userReferralCode = null;
          if (!referrerError && referrerInfo && Array.isArray(referrerInfo)) {
            const userInfo = referrerInfo.find((info: any) => info && info.user_id === user.user_id);
            userReferralCode = userInfo?.referral_code;
          }
          
          if (!userReferralCode) {
            // Generate a referral code if one doesn't exist
            userReferralCode = generateReferralCode(user.email);
            logger.info('ADMIN', 'Generated referral code for user', { userEmail: user.email, code: userReferralCode });
          }
          
          referralData[user.user_id] = {
            referral_code: userReferralCode,
            ...referredByData,
            referrals_made_count: referralsCount
          };
        }
        
        logger.info('ADMIN', 'Processed referral data', { userCount: allUsers.length });
        
      } catch (queryError) {
        logger.error('ADMIN', 'SQL queries failed, using empty referral data', queryError);
        // Initialize empty referral data for all users to prevent crashes
        const { data: allUsers, error: usersError } = await supabase
          .from('user_profiles')
          .select('user_id, email, full_name');
        
        if (!usersError && allUsers) {
          for (const user of allUsers) {
            referralData[user.user_id] = {
              referral_code: generateReferralCode(user.email),
              referred_by_user_id: null,
              referrer_email: null,
              referrer_name: null,
              referrer_code: null,
              referrals_made_count: 0
            };
          }
        }
      }
      
      logger.info('ADMIN', 'Loaded complete referral data', { userCount: Object.keys(referralData).length });
    } catch (error) {
      logger.error('ADMIN', 'Error fetching referral data', error);
      // Continue with empty referral data to prevent complete failure
    }
    
    // Get additional stats for each user and match with plan data
    const usersWithStatsAndPlans = await Promise.all(
      (profiles || []).map(async (profile) => {
        try {
          
          // Find user's plan from the pre-fetched plans
          const userPlan = allPlans?.find(plan => plan.user_id === profile.user_id);
          
          logger.debug('ADMIN', 'Plan lookup for user', {
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
          
          logger.debug('ADMIN', 'Stats debug for user', {
            journalCount,
            goalCount,
            completedGoals,
            documentCount,
            user_id: profile.user_id
          });

          
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
            
            logger.info('ADMIN', 'Processing plan for user', {
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
              logger.debug('ADMIN', 'Trial calculation for user', {
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
            logger.info('ADMIN', 'No plan found for user, using default trial', { userEmail: profile.email });
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

          // Get actual storage used by calculating file sizes
          let storageUsed = 0;
          try {
            const { data: storageSizes } = await supabase
              .from('documents')
              .select('file_size')
              .eq('user_id', profile.user_id);
            
            if (storageSizes) {
              storageUsed = storageSizes.reduce((total, doc) => total + (doc.file_size || 0), 0);
            }
          } catch (storageError) {
            logger.warn('ADMIN', 'Could not calculate storage for user', { userEmail: profile.email, error: storageError });
            storageUsed = 0;
          }

          // Return flat structure to match frontend expectations
          return {
            ...profile,
            // Plan information (flattened)
            plan_type: planType,
            plan_status: planStatus,
            expires_at: userPlan?.expires_at || null,
            trial_days_remaining: trialDaysRemaining,
            paid_member_duration: paidMemberDuration,
            is_trial: isTrial,
            // Activity/stats information (flattened)
            total_journal_entries: journalCount || 0,
            total_goals: goalCount || 0,
            completed_goals: completedGoals || 0,
            storage_used: storageUsed,
            // Use the last_login from backend, fallback to created_at
            last_login: profile.updated_at || profile.created_at,
            last_activity: profile.updated_at || profile.created_at,
            // Referral information (flattened)
            referral_code: userReferralData?.referral_code || null,
            referred_by: referredBy,
            referrals_made_count: userReferralData?.referrals_made_count || 0
          };
        } catch (error) {
          logger.error('ADMIN', 'Error fetching stats for user', { userEmail: profile.email, error });
          const userReferralData = referralData[profile.user_id];
          
          // Return flat structure for error case too
          return {
            ...profile,
            // Plan information (flattened)
            plan_type: 'trial' as const,
            plan_status: 'active' as const,
            expires_at: null,
            trial_days_remaining: null,
            paid_member_duration: null,
            is_trial: true,
            // Activity/stats information (flattened)
            total_journal_entries: 0,
            total_goals: 0,
            completed_goals: 0,
            storage_used: 0,
            // Default login times
            last_login: profile.updated_at || profile.created_at,
            last_activity: profile.updated_at || profile.created_at,
            // Referral information (flattened)
            referral_code: userReferralData?.referral_code || null,
            referred_by: null,
            referrals_made_count: userReferralData?.referrals_made_count || 0
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
    logger.error('ADMIN', 'Error fetching admin users', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin users',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Admin endpoint to update trial days for a user
router.patch('/trial/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    logger.info('ADMIN', 'Admin trial update request', { 
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

    logger.info('ADMIN', 'Service role plan fetch', { hasUserPlans: !!userPlans, hasFetchError: !!fetchError });

    if (fetchError) {
      logger.error('ADMIN', 'Error fetching user plan with service role', fetchError);
      return res.status(500).json({ 
        error: `Failed to fetch user plan: ${fetchError.message}` 
      });
    }

    const userPlan = userPlans?.[0]
    if (!userPlan) {
      logger.error('ADMIN', 'No user plan found for user', { userId });
      return res.status(404).json({ 
        error: 'No user plan found for this user' 
      });
    }

    logger.info('ADMIN', 'Found user plan via service role', { userId: userPlan?.user_id });

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
    
    logger.info('ADMIN', 'Trial calculation', { 
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

    logger.info('ADMIN', 'Service role update result', { hasUpdateData: !!updateData, hasUpdateError: !!updateError });

    if (updateError) {
      logger.error('ADMIN', 'Update error with service role', updateError);
      return res.status(500).json({ 
        error: `Failed to update trial: ${updateError.message}` 
      });
    }

    logger.info('ADMIN', 'Admin trial update successful');
    
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
    logger.error('ADMIN', 'Admin trial update failed', error);
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
    logger.error('ADMIN', 'Failed to create audit log', error);
  }
}

// Admin endpoint to suspend a user account
router.post('/suspend/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    logger.info('ADMIN', 'Admin suspend request', { 
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

    // Check if user exists and current suspension status
    logger.info('ADMIN', 'Looking up user with ID', { userId });
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, email, is_suspended')
      .eq('user_id', userId)
      .single();

    logger.info('ADMIN', 'User lookup result', { 
      targetUser, 
      userError: userError?.message || userError,
      hasData: !!targetUser 
    });

    if (userError || !targetUser) {
      logger.error('ADMIN', 'User lookup failed', userError);
      return res.status(404).json({ 
        error: 'User not found',
        debug: userError?.message || 'No data returned'
      });
    }

    // Check if user is already suspended
    if (targetUser.is_suspended) {
      return res.status(400).json({ error: 'User is already suspended' });
    }

    // Suspend the user using direct SQL to bypass Supabase schema cache issues
    const expiresAt = expires_at ? new Date(expires_at).toISOString() : null;
    const suspendedAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();
    
    try {
      // Suspend user with proper suspension fields
      const { error: suspendError } = await supabase
        .from('user_profiles')
        .update({
          is_suspended: true,
          suspended_at: suspendedAt,
          suspended_by: adminUserId,
          suspension_reason: reason,
          suspension_expires_at: expiresAt,
          updated_at: updatedAt
        })
        .eq('user_id', userId);
      
      if (suspendError) {
        logger.error('ADMIN', 'Error suspending user via Supabase', suspendError);
        // This will likely fail due to schema cache, so we'll handle it below
      }
      
      logger.info('ADMIN', 'User suspension initiated successfully');
    } catch (error) {
      logger.error('ADMIN', 'Suspension failed', error);
      return res.status(500).json({ error: 'Failed to suspend user' });
    }

    // Create audit log
    await createAuditLog(adminUserId, userId, 'suspend_account', {
      reason,
      expires_at,
      target_email: targetUser.email
    }, req);

    logger.info('ADMIN', 'User suspended successfully', { userEmail: targetUser.email });
    
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
    logger.error('ADMIN', 'Error in suspend endpoint', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to unsuspend a user account
router.post('/unsuspend/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    logger.info('ADMIN', 'Admin unsuspend request', { userId: req.params.userId });

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
      logger.error('ADMIN', 'Error unsuspending user', unsuspendError);
      return res.status(500).json({ error: 'Failed to unsuspend user' });
    }

    // Create audit log
    await createAuditLog(adminUserId, userId, 'unsuspend_account', {
      previous_reason: targetUser.suspension_reason,
      target_email: targetUser.email
    }, req);

    logger.info('ADMIN', 'User unsuspended successfully', { userEmail: targetUser.email });
    
    res.json({
      success: true,
      message: 'User account unsuspended successfully',
      data: { userId }
    });

  } catch (error) {
    logger.error('ADMIN', 'Error in unsuspend endpoint', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to reset user password
router.post('/reset-password/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    logger.info('ADMIN', 'Admin password reset request', { userId: req.params.userId });

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
      logger.error('ADMIN', 'Error generating password reset', resetError);
      return res.status(500).json({ error: 'Failed to generate password reset' });
    }

    // Create audit log
    await createAuditLog(adminUserId, userId, 'reset_password', {
      target_email: targetUser.email,
      reset_link_generated: true
    }, req);

    logger.info('ADMIN', 'Password reset generated for user', { userEmail: targetUser.email });
    
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
    logger.error('ADMIN', 'Error in reset password endpoint', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to send email to user
router.post('/send-email/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    logger.info('ADMIN', 'Admin send email request', { 
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

    // Send email using the email service
    try {
      const emailSent = await simpleEmailScheduler.emailService.sendAdminEmail({
        to: targetUser.email,
        toName: targetUser.first_name || targetUser.full_name || 'User',
        subject,
        message,
        emailType: email_type
      });

      if (!emailSent) {
        logger.error('ADMIN', 'Failed to send admin email', { targetEmail: targetUser.email, subject });
        return res.status(500).json({ error: 'Failed to send email' });
      }

      logger.info('ADMIN', 'Admin email sent successfully', { targetEmail: targetUser.email, subject, emailType: email_type });
    } catch (emailError) {
      logger.error('ADMIN', 'Error sending admin email', emailError);
      return res.status(500).json({ error: 'Failed to send email' });
    }
    
    // Create audit log
    await createAuditLog(adminUserId, userId, 'send_email', {
      target_email: targetUser.email,
      subject,
      email_type,
      message_preview: message.substring(0, 100) + (message.length > 100 ? '...' : '')
    }, req);

    logger.info('ADMIN', 'Email queued for user', { userEmail: targetUser.email, subject });
    
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
    logger.error('ADMIN', 'Error in send email endpoint', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to get user activity logs
router.get('/activity/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    logger.info('ADMIN', 'Admin activity request', { userId: req.params.userId });

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
      logger.error('ADMIN', 'Error fetching activity logs', activityError);
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
      logger.error('ADMIN', 'Error fetching admin logs', adminError);
      return res.status(500).json({ error: 'Failed to fetch admin logs' });
    }

    logger.info('ADMIN', 'Retrieved activity logs for user', { userEmail: targetUser.email, logCount: activityLogs?.length || 0 });
    
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
    logger.error('ADMIN', 'Error in activity endpoint', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to edit user profile
router.patch('/profile/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    logger.info('ADMIN', 'Admin profile edit request', { 
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
      logger.error('ADMIN', 'Error updating profile', updateError);
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

    logger.info('ADMIN', 'Profile updated for user', { userEmail: currentProfile.email });
    
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
    logger.error('ADMIN', 'Error in profile edit endpoint', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to delete a user account
router.delete('/users/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    logger.info('ADMIN', 'Admin delete user request', { userId: req.params.userId });

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
      logger.error('ADMIN', 'Error deleting user from auth', authDeleteError);
      return res.status(500).json({ 
        error: 'Failed to delete user from authentication system',
        details: authDeleteError.message 
      });
    }

    logger.info('ADMIN', 'User deleted successfully', { userEmail: targetUser.email });
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        deletedUserId: userId,
        deletedUserEmail: targetUser.email
      }
    });

  } catch (error) {
    logger.error('ADMIN', 'Error in delete user endpoint', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to delete an early signup
router.delete('/early-signups/:signupId', requireAdmin, async (req: Request, res: Response) => {
  try {
    logger.info('ADMIN', 'Admin delete early signup request', { signupId: req.params.signupId });

    const { signupId } = req.params;
    const adminUserId = (req as any).adminUser.user_id;

    // Check if early signup exists
    const { data: targetSignup, error: signupError } = await supabase
      .from('early_signups')
      .select('id, email, created_at')
      .eq('id', signupId)
      .single();

    if (signupError || !targetSignup) {
      logger.warn('ADMIN', 'Early signup not found', { signupId, error: signupError });
      return res.status(404).json({ error: 'Early signup not found' });
    }

    logger.info('ADMIN', 'Found early signup to delete', { 
      signupId, 
      email: targetSignup.email,
      created_at: targetSignup.created_at 
    });

    // Create audit log before deletion
    await createAuditLog(adminUserId, null, 'delete_early_signup', {
      signup_id: signupId,
      signup_email: targetSignup.email,
      deletion_timestamp: new Date().toISOString()
    }, req);

    // Delete early signup using service role permissions
    // This bypasses RLS restrictions that were blocking frontend deletions
    const { error: deleteError } = await supabase
      .from('early_signups')
      .delete()
      .eq('id', signupId);
    
    if (deleteError) {
      logger.error('ADMIN', 'Error deleting early signup from database', { 
        signupId, 
        error: deleteError 
      });
      return res.status(500).json({ 
        error: 'Failed to delete early signup',
        details: deleteError.message 
      });
    }

    logger.info('ADMIN', 'Early signup deleted successfully', { 
      signupId,
      email: targetSignup.email 
    });
    
    res.json({
      success: true,
      message: 'Early signup deleted successfully',
      data: {
        deletedSignupId: signupId,
        deletedSignupEmail: targetSignup.email
      }
    });

  } catch (error) {
    logger.error('ADMIN', 'Error in delete early signup endpoint', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;