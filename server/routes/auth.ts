import express from 'express';
import { supabase } from '../lib/supabase.js';
import { simpleEmailScheduler } from '../services/SimpleEmailScheduler.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const router = express.Router();

// TEMPORARY: Direct signup for testing referrals (bypasses email verification)
router.post('/signup-direct', async (req, res) => {
  try {
    const { email, password, referralCode, first_name, last_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    console.log('🚀 TESTING: Direct signup initiated for:', email);

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser.users.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (userExists) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Validate referral code if provided
    let referredByUserId = null;
    if (referralCode && referralCode.trim()) {
      console.log('🔍 Validating referral code:', referralCode);
      
      try {
        const response = await fetch(`http://localhost:5000/api/referrals/validate/${referralCode}`);
        const validationResult = await response.json();
        
        if (validationResult.valid && validationResult.referrer) {
          referredByUserId = validationResult.referrer.user_id;
          console.log('✅ Valid referral code found for:', validationResult.referrer.email);
        } else {
          console.log('❌ Invalid referral code provided:', referralCode);
        }
      } catch (error) {
        console.error('⚠️ Error validating referral code:', error);
      }
    }

    // Create the user directly in Supabase Auth
    const { data: authResult, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirm email for testing
      user_metadata: {
        first_name: first_name,
        last_name: last_name,
        full_name: `${first_name || ''} ${last_name || ''}`.trim() || email
      }
    });

    if (authError || !authResult.user) {
      console.error('❌ Failed to create auth user:', authError);
      return res.status(500).json({ error: 'Failed to create user account' });
    }

    console.log('✅ Auth user created:', authResult.user.id);

    // Create user profile with referral information
    const profileData = {
      user_id: authResult.user.id,
      email: email.toLowerCase(),
      first_name: first_name || null,
      last_name: last_name || null,
      full_name: `${first_name || ''} ${last_name || ''}`.trim() || email,
      business_name: null,
      referred_by_user_id: referredByUserId,
      referral_code: generateReferralCode(email),
      is_admin: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: profileResult, error: profileError } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('❌ Failed to create user profile:', profileError);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authResult.user.id);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    console.log('✅ User profile created with referral link:', { 
      userId: profileResult.user_id, 
      referredBy: referredByUserId 
    });

    // Create default trial plan
    const { error: planError } = await supabase
      .from('user_plans')
      .insert({
        user_id: authResult.user.id,
        plan_type: 'free',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
        created_at: new Date().toISOString()
      });

    if (planError) {
      console.error('⚠️ Failed to create user plan:', planError);
    }

    res.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        referral_code: profileResult.referral_code,
        referred_by: referredByUserId ? 'Yes' : 'No'
      }
    });

  } catch (error) {
    console.error('💥 Error in direct signup:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// UNIFIED REFERRAL CODE GENERATION SYSTEM
// This function generates consistent, stable referral codes that never change for a given email
function generateReferralCode(email: string): string {
  const cleanEmail = email.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Create a consistent hash using the same algorithm as server referrals.ts
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

// Email-first signup route - no account created until email verification
router.post('/signup', async (req, res) => {
  try {
    const { email, password, referralCode, first_name, last_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    console.log('📧 Email-first signup initiated for:', email);

    // Check if user already exists in auth.users or pending_signups
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser.users.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (userExists) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const { data: existingPending } = await supabase
      .from('pending_signups')
      .select('id, email, verified, expires_at')
      .eq('email', email.toLowerCase())
      .single();

    if (existingPending) {
      if (new Date() < new Date(existingPending.expires_at)) {
        return res.status(400).json({ 
          error: 'A verification email was already sent to this address. Please check your inbox or wait 15 minutes to try again.' 
        });
      }
      
      // Clean up expired pending signup
      await supabase.from('pending_signups').delete().eq('id', existingPending.id);
    }

    // Validate referral code if provided (but don't fail signup if invalid)
    let isValidReferral = false;
    if (referralCode && referralCode.trim()) {
      try {
        const response = await fetch(`http://localhost:5000/api/referrals/validate/${referralCode}`);
        const validationResult = await response.json();
        isValidReferral = validationResult.valid;
        console.log('📝 Referral validation result:', { code: referralCode, valid: isValidReferral });
      } catch (referralError) {
        console.error('Error validating referral code:', referralError);
      }
    }

    // Hash password securely
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate secure verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Store pending signup using Supabase client
    console.log('🔧 Creating pending signup via Supabase client...');
    
    const { data: pendingSignupData, error: pendingError } = await supabase
      .from('pending_signups')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        referral_code: referralCode && isValidReferral ? referralCode.trim().toUpperCase() : null,
        verification_token: verificationToken,
        first_name: first_name?.trim() || null,
        last_name: last_name?.trim() || null,
        verified: false,
        expires_at: expiresAt,
        attempts: 0
      })
      .select('id, email, created_at');
    
    const pendingSignup = pendingSignupData?.[0];

    if (pendingError) {
      console.error('❌ Failed to create pending signup:', {
        error: pendingError,
        errorCode: pendingError?.code,
        errorMessage: pendingError?.message,
        errorDetails: pendingError?.details,
        errorHint: pendingError?.hint,
        fullError: JSON.stringify(pendingError, null, 2)
      });
      return res.status(500).json({ 
        error: 'Failed to process signup request - database insert error',
        debug: process.env.NODE_ENV === 'development' ? {
          supabaseError: pendingError,
          errorMessage: pendingError?.message || 'No error message available',
          errorCode: pendingError?.code || 'No error code available'
        } : undefined
      });
    }

    if (!pendingSignup) {
      return res.status(500).json({ error: 'Failed to create pending signup - no data returned' });
    }
    
    console.log('✅ Pending signup created successfully:', pendingSignup.id);
    
    console.log('✅ Pending signup process completed successfully');

    // Generate verification URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://bizzin.co.za' 
      : 'http://localhost:5000';
    
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    // Send verification email
    const emailSent = await simpleEmailScheduler.emailService.sendWelcomeEmail(
      email,
      verificationUrl
    );

    if (emailSent) {
      console.log(`✅ Verification email sent to ${email}`);
      
      let responseMessage = "Please check your email to verify your account and complete registration.";
      if (referralCode && isValidReferral) {
        responseMessage += " Welcome bonus will be applied once you verify your email!";
      } else if (referralCode && !isValidReferral) {
        responseMessage += " (Referral code not found)";
      } else {
        responseMessage += " Your 14-day free trial will begin once you verify your email!";
      }

      res.json({ 
        success: true,
        message: responseMessage,
        email_sent: true,
        requires_verification: true
      });
    } else {
      console.error(`❌ Failed to send verification email to ${email}`);
      
      // Clean up pending signup if email fails
      await supabase.from('pending_signups').delete().eq('verification_token', verificationToken);
      
      res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

  } catch (error) {
    console.error('❌ Server signup error:', error);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
});

// Email verification endpoint - creates actual user account after verification
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    console.log('🔍 Email verification attempted with token:', token.substring(0, 8) + '...');

    // Find pending signup by token
    const { data: pendingSignup, error: pendingError } = await supabase
      .from('pending_signups')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (pendingError || !pendingSignup) {
      console.error('❌ Invalid or expired verification token');
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? 'https://bizzin.co.za/auth?error=invalid_token' 
        : 'http://localhost:5000/auth?error=invalid_token';
      return res.redirect(redirectUrl);
    }

    // Check if token expired
    if (new Date() > new Date(pendingSignup.expires_at)) {
      console.error('❌ Verification token expired for:', pendingSignup.email);
      
      // Clean up expired token
      await supabase.from('pending_signups').delete().eq('id', pendingSignup.id);
      
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? 'https://bizzin.co.za/auth?error=token_expired' 
        : 'http://localhost:5000/auth?error=token_expired';
      return res.redirect(redirectUrl);
    }

    // Check if already verified (prevent replay attacks)
    if (pendingSignup.verified) {
      console.warn('⚠️ Token already used for:', pendingSignup.email);
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? 'https://bizzin.co.za/auth?error=already_verified' 
        : 'http://localhost:5000/auth?error=already_verified';
      return res.redirect(redirectUrl);
    }

    console.log('✅ Valid pending signup found for:', pendingSignup.email);

    // Now create the actual user account
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: pendingSignup.email,
      password: pendingSignup.password_hash, // bcrypt hash is compatible with Supabase
      email_confirm: true, // Mark email as verified immediately
      user_metadata: {
        referral_code: pendingSignup.referral_code || null,
        signup_method: 'email_verified',
        first_name: pendingSignup.first_name || null,
        last_name: pendingSignup.last_name || null
      }
    });

    if (signUpError) {
      console.error('❌ Failed to create user account:', signUpError);
      return res.status(500).json({ error: 'Failed to create user account' });
    }

    if (!signUpData.user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    console.log('✅ User account created successfully:', signUpData.user.id);

    // Process referral if provided
    let referredByUserId: string | undefined;
    
    if (pendingSignup.referral_code) {
      try {
        console.log('🔍 Processing referral code for verified user:', pendingSignup.referral_code);
        
        // Find referrer by checking generated codes
        const { data: allUsers, error: usersError } = await supabase
          .from('user_profiles')
          .select('user_id, email, full_name')
          .not('email', 'is', null);

        if (!usersError && allUsers && allUsers.length > 0) {
          const searchCode = pendingSignup.referral_code.trim().toUpperCase();
          
          for (const user of allUsers) {
            const generatedCode = generateReferralCode(user.email);
            if (generatedCode === searchCode) {
              // Prevent self-referral
              if (user.email.toLowerCase() !== pendingSignup.email.toLowerCase()) {
                referredByUserId = user.user_id;
                console.log(`✅ Valid referrer found: ${user.email} (code: ${generatedCode})`);
                break;
              } else {
                console.warn('🚫 Self-referral blocked during verification');
              }
            }
          }
        }
      } catch (referralError) {
        console.error('Error processing referral during verification:', referralError);
      }
    }

    // Generate referral code for new user
    const userReferralCode = generateReferralCode(pendingSignup.email);

    // Create user profile
    try {
      console.log('🔧 Creating user profile for verified user:', signUpData.user.id);
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: signUpData.user.id,
          email: pendingSignup.email,
          first_name: pendingSignup.first_name || null,
          last_name: pendingSignup.last_name || null,
          full_name: pendingSignup.first_name && pendingSignup.last_name 
            ? `${pendingSignup.first_name} ${pendingSignup.last_name}`.trim()
            : pendingSignup.email.split('@')[0],
          referral_code: userReferralCode,
          referred_by_user_id: referredByUserId || null
        });

      if (profileError) {
        console.error('❌ Failed to create user profile:', profileError);
      } else {
        console.log('✅ User profile created successfully');
        
        // Create referral record if user was referred
        if (referredByUserId) {
          const { error: referralRecordError } = await supabase
            .from('referrals')
            .insert({
              referrer_user_id: referredByUserId,
              referred_user_id: signUpData.user.id,
              status: 'captured',
              created_at: new Date().toISOString()
            });

          if (referralRecordError) {
            console.error('❌ Failed to create referral record:', referralRecordError);
          } else {
            console.log('✅ Referral record created successfully');
          }
        }
      }
    } catch (profileCreationError) {
      console.error('❌ Error during profile creation:', profileCreationError);
    }

    // Mark pending signup as verified and clean up
    try {
      await supabase
        .from('pending_signups')
        .update({ verified: true })
        .eq('id', pendingSignup.id);

      // Delete the pending signup after successful verification
      setTimeout(async () => {
        await supabase.from('pending_signups').delete().eq('id', pendingSignup.id);
      }, 5000); // Clean up after 5 seconds
      
    } catch (cleanupError) {
      console.error('❌ Error during cleanup:', cleanupError);
    }

    console.log('🎉 Email verification completed successfully for:', pendingSignup.email);

    // Redirect to success page
    const redirectUrl = process.env.NODE_ENV === 'production' 
      ? 'https://bizzin.co.za/auth?verified=true&welcome=true' 
      : 'http://localhost:5000/auth?verified=true&welcome=true';
    
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Email verification error:', error);
    const redirectUrl = process.env.NODE_ENV === 'production' 
      ? 'https://bizzin.co.za/auth?error=verification_failed' 
      : 'http://localhost:5000/auth?error=verification_failed';
    return res.redirect(redirectUrl);
  }
});

// Resend verification email endpoint - for pending signups
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('📧 Resend verification request for pending signup:', email);

    // Check if there's a pending signup for this email
    const { data: pendingSignup, error: pendingError } = await supabase
      .from('pending_signups')
      .select('id, email, verification_token, expires_at, attempts')
      .eq('email', email.toLowerCase())
      .eq('verified', false)
      .single();

    if (pendingError || !pendingSignup) {
      console.log('❌ No pending signup found for:', email);
      // Don't reveal if user exists for security - just return success message
      return res.json({ 
        message: 'If a pending signup with this email exists, you will receive a verification email.' 
      });
    }

    // Check if token expired - clean it up and allow resend
    if (new Date() > new Date(pendingSignup.expires_at)) {
      console.log('📝 Expired pending signup found, cleaning up and allowing new verification:', email);
      await supabase.from('pending_signups').delete().eq('id', pendingSignup.id);
      
      return res.status(400).json({ 
        error: 'Your verification link expired. Please sign up again to receive a new verification email.' 
      });
    }

    // Rate limiting - prevent spam by limiting to 3 resend attempts
    if (pendingSignup.attempts >= 3) {
      console.warn('⚠️ Too many resend attempts for:', email);
      return res.status(429).json({ 
        error: 'Too many verification attempts. Please wait 24 hours or sign up again.' 
      });
    }

    // Generate new verification token to prevent potential replay attacks
    const newVerificationToken = crypto.randomBytes(32).toString('hex');
    
    // Update the pending signup with new token and increment attempts
    const { error: updateError } = await supabase
      .from('pending_signups')
      .update({ 
        verification_token: newVerificationToken,
        attempts: pendingSignup.attempts + 1
      })
      .eq('id', pendingSignup.id);

    if (updateError) {
      console.error('❌ Failed to update pending signup token:', updateError);
      return res.status(500).json({ error: 'Failed to generate new verification link' });
    }

    // Generate new verification URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://bizzin.co.za' 
      : 'http://localhost:5000';
    
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${newVerificationToken}`;

    // Send new verification email
    const emailSent = await simpleEmailScheduler.emailService.sendWelcomeEmail(
      email,
      verificationUrl
    );

    if (emailSent) {
      console.log(`✅ Verification email resent to ${email} (attempt ${pendingSignup.attempts + 1})`);
      res.json({ 
        message: 'Verification email sent successfully. Please check your inbox and spam folder.' 
      });
    } else {
      console.error(`❌ Failed to resend verification email to ${email}`);
      res.status(500).json({ error: 'Failed to send verification email' });
    }

  } catch (error) {
    console.error('❌ Resend verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;