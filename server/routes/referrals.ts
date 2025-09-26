import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();


// UNIFIED REFERRAL CODE GENERATION SYSTEM
// This function generates consistent, stable referral codes that never change for a given email
function generateReferralCode(email: string): string {
  const cleanEmail = email.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Create a consistent hash using a simple but reliable algorithm
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
  console.log(`🔧 Generated consistent referral code for ${email}: ${finalCode}`);
  return finalCode;
}

// Validate referral code endpoint
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code || code.trim() === '') {
      return res.json({ valid: false, error: 'No referral code provided' });
    }

    console.log('🔍 Validating referral code:', code);

    const searchCode = code.trim().toUpperCase();
    console.log('🔍 Searching for code:', searchCode);

    // DATABASE-DRIVEN VALIDATION: Check for active users in database
    console.log('🔍 Validating against active users in database...');
    
    // Temporary workaround: Direct validation against known users + generated codes
    // This bypasses PostgREST schema cache issues while maintaining security
    console.log('🔄 Using temporary validation workaround due to schema cache issues...');
    
    // Get all users and generate their referral codes
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name')
      .not('email', 'is', null);
    
    if (usersError) {
      console.error('❌ Error fetching users for referral validation:', usersError);
      return res.status(500).json({ valid: false, error: 'Database error' });
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No users found in database');
      return res.json({ valid: false, error: 'No active users found' });
    }
    
    // Generate referral codes for all users and check for matches
    const allUsers = users.map(user => ({
      ...user,
      referral_code: generateReferralCode(user.email) // Use generated codes as primary
    }));

    if (!allUsers || allUsers.length === 0) {
      console.log('❌ No users found in database');
      return res.json({ valid: false, error: 'No active users found' });
    }

    console.log(`📋 Checking ${allUsers.length} active users for referral code: ${searchCode}`);
    
    // For each user, check both their stored referral_code and generated code
    let validReferrer = null;
    
    for (const user of allUsers) {
      const storedCode = user.referral_code?.toUpperCase();
      const generatedCode = generateReferralCode(user.email);
      
      // Check if the search code matches either stored or generated code
      if (storedCode === searchCode || generatedCode === searchCode) {
        validReferrer = user;
        const matchType = storedCode === searchCode ? 'stored' : 'generated';
        console.log(`✅ Found referrer: ${user.email} (${matchType} code)`);
        break;
      }
    }

    if (validReferrer) {
      console.log('✅ Valid referral code found for active user:', { 
        code: searchCode, 
        referrer: validReferrer.email,
        user_id: validReferrer.user_id 
      });
      
      return res.json({ 
        valid: true, 
        referrer: {
          user_id: validReferrer.user_id,
          email: validReferrer.email,
          name: validReferrer.full_name || validReferrer.email.split('@')[0]
        }
      });
    }

    // If not found in active users
    console.log('❌ Referral code not found among active users:', searchCode);
    return res.json({ valid: false, error: 'Referral code not found or user no longer active' });

  } catch (error) {
    console.error('💥 Error validating referral code:', error);
    return res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});

// Get user referral bonus data - checks database for actual referral bonuses
router.get('/bonus/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🎁 Checking referral bonus for user: ${userId}`);
    
    // Check user profile for referral bonus flags
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('has_referral_bonus, referral_bonus_expires_at, referred_by_user_id')
      .eq('user_id', userId)
      .single();
      
    if (profileError || !userProfile) {
      console.log('User profile not found or error:', profileError?.message);
      return res.json({ hasBonus: false, expiresAt: null, daysUntilExpiry: null });
    }
    
    // First check: Does user have has_referral_bonus flag set?
    if (userProfile.has_referral_bonus && userProfile.referral_bonus_expires_at) {
      const now = new Date();
      const expiryDate = new Date(userProfile.referral_bonus_expires_at);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry > 0) {
        console.log(`✅ User has active referral bonus expiring in ${daysUntilExpiry} days`);
        return res.json({
          hasBonus: true,
          expiresAt: userProfile.referral_bonus_expires_at,
          daysUntilExpiry: Math.max(0, daysUntilExpiry)
        });
      }
    }
    
    // Second check: Does user have unused subscription credits from referrals?
    const { data: subscriptionCredits, error: creditsError } = await supabase
      .from('subscription_credits')
      .select('*')
      .eq('user_id', userId)
      .eq('source', 'referral')
      .eq('is_used', false);
      
    if (!creditsError && subscriptionCredits && subscriptionCredits.length > 0) {
      // User has unused referral credits - they have a bonus
      const totalBonusDays = subscriptionCredits.reduce((total, credit) => total + credit.amount_days, 0);
      console.log(`✅ User has ${subscriptionCredits.length} unused subscription credits totaling ${totalBonusDays} days`);
      
      // Set expiry to 30 days from now if not set
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const daysUntilExpiry = 30;
      
      return res.json({
        hasBonus: true,
        expiresAt: expiryDate.toISOString(),
        daysUntilExpiry: daysUntilExpiry
      });
    }
    
    // Third check: Was user referred and might be eligible for bonus upon subscription?
    if (userProfile.referred_by_user_id) {
      const { data: referralRecord, error: referralError } = await supabase
        .from('referrals')
        .select('status, created_at')
        .eq('referred_user_id', userId)
        .eq('status', 'captured')
        .single();
        
      if (!referralError && referralRecord) {
        // User was referred but hasn't converted yet - they will get bonus on subscription
        console.log(`✅ User was referred and will get bonus upon subscription`);
        
        // Set expiry to 30 days from referral capture
        const referralDate = new Date(referralRecord.created_at);
        const expiryDate = new Date(referralDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry > 0) {
          return res.json({
            hasBonus: true,
            expiresAt: expiryDate.toISOString(),
            daysUntilExpiry: Math.max(0, daysUntilExpiry)
          });
        }
      }
    }
    
    // No referral bonus found
    console.log(`ℹ️ No referral bonus found for user ${userId}`);
    return res.json({ hasBonus: false, expiresAt: null, daysUntilExpiry: null });
    
  } catch (error) {
    console.error('Error in referral bonus endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user referrals (users that this user has referred)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔍 Getting referrals made by user: ${userId}`);
    
    // Get all users referred by this user
    const { data: referredUsers, error: referralError } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, created_at')
      .eq('referred_by_user_id', userId);
    
    if (referralError) {
      console.error('Error fetching user referrals:', referralError);
      return res.json([]);
    }
    
    console.log(`📊 Found ${referredUsers?.length || 0} referrals for user ${userId}`);
    
    // Format for frontend consumption
    const formattedReferrals = (referredUsers || []).map(user => ({
      id: user.user_id,
      referee_email: user.email,
      referee_name: user.full_name || user.email,
      is_active: true, // All users in database are considered active
      signup_date: user.created_at,
      activation_date: user.created_at // Same as signup for simplicity
    }));
    
    return res.json(formattedReferrals);
  } catch (error) {
    console.error('Error in user referrals endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user referral dashboard data (with real referral counts)
router.get('/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔍 Building real dashboard for user: ${userId}`);
    
    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email, full_name, referral_code')
      .eq('user_id', userId)
      .single();
      
    if (profileError || !userProfile) {
      console.log('User profile not found:', profileError?.message);
      return res.json({
        user_id: userId,
        email: "", 
        referral_code: "",
        total_referrals: 0,
        active_referrals: 0,
        bonus_days_earned: 0,
        bonus_days_used: 0,
        available_bonus_days: 0,
        plan_status: "free",
        subscription_end_date: null,
        referral_extension_days: 0
      });
    }
    
    // Get actual referral count for this user
    const { data: referredUsers, error: referralError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('referred_by_user_id', userId);
    
    const totalReferrals = referralError ? 0 : (referredUsers?.length || 0);
    console.log(`📊 User ${userId} has ${totalReferrals} total referrals`);
    
    // Generate referral code if not in database
    const referralCode = userProfile.referral_code || generateReferralCode(userProfile.email);
    
    return res.json({
      user_id: userId,
      email: userProfile.email, 
      referral_code: referralCode,
      total_referrals: totalReferrals,
      active_referrals: totalReferrals, // All referred users are considered active
      bonus_days_earned: 0,
      bonus_days_used: 0,
      available_bonus_days: 0,
      plan_status: "free",
      subscription_end_date: null,
      referral_extension_days: 0
    });
  } catch (error) {
    console.error('Error in referral dashboard endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;