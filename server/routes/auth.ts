import express from 'express';
import { supabase } from '../lib/supabase.js';
import { simpleEmailScheduler } from '../services/SimpleEmailScheduler.js';

const router = express.Router();

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

// Server-side signup route with custom email verification
router.post('/signup', async (req, res) => {
  try {
    const { email, password, referralCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('🔐 Server-side signup initiated for:', email);

    // Validate referral code if provided
    let isValidReferral = false;
    if (referralCode && referralCode.trim()) {
      try {
        const response = await fetch(`http://localhost:5000/api/referrals/validate/${referralCode}`);
        const validationResult = await response.json();
        isValidReferral = validationResult.valid;
        console.log('📝 Referral validation result:', { code: referralCode, valid: isValidReferral });
      } catch (referralError) {
        console.error('Error validating referral code:', referralError);
        // Continue with signup even if referral validation fails
      }
    }

    // Create user with email_confirm: false using admin API
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // We'll handle email confirmation ourselves
      user_metadata: {
        referral_code: referralCode || null,
        signup_method: 'server_initiated'
      }
    });

    if (signUpError) {
      console.error('❌ Supabase admin signup error:', signUpError);
      return res.status(400).json({ error: signUpError.message });
    }

    if (!signUpData.user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    console.log('✅ User created successfully via admin API:', signUpData.user.id);

    // Process referral and create user profile atomically if valid referral code
    let referredByUserId: string | undefined;
    let userReferralCode: string = '';
    
    if (referralCode && isValidReferral) {
      try {
        console.log('🔍 Processing referral code during signup:', referralCode);
        
        // Use same workaround as validation endpoint - get all users and check generated codes
        const { data: allUsers, error: usersError } = await supabase
          .from('user_profiles')
          .select('user_id, email, full_name')
          .not('email', 'is', null);

        if (usersError) {
          console.error('❌ Error fetching users for referral processing:', usersError);
        } else if (allUsers && allUsers.length > 0) {
          // Find referrer by checking generated codes
          const searchCode = referralCode.trim().toUpperCase();
          let referrer = null;
          
          for (const user of allUsers) {
            const generatedCode = generateReferralCode(user.email);
            if (generatedCode === searchCode) {
              referrer = user;
              console.log(`✅ Found referrer during signup: ${user.email} (code: ${generatedCode})`);
              break;
            }
          }

          if (referrer) {
            // Check both user_id and email to prevent self-referral abuse
            if (referrer.user_id !== signUpData.user.id && referrer.email.toLowerCase() !== email.toLowerCase()) {
              referredByUserId = referrer.user_id;
              console.log('✅ Valid referrer confirmed for signup:', { userId: referredByUserId, email: referrer.email });
            } else {
              if (referrer.email.toLowerCase() === email.toLowerCase()) {
                console.warn('🚫 Self-referral blocked during signup: user trying to refer themselves using their own email\'s referral code');
              } else {
                console.warn('🚫 Self-referral blocked during signup: same user_id');
              }
            }
          } else {
            console.warn('❌ Referrer not found during signup processing');
          }
        }
      } catch (referralError) {
        console.error('Error processing referral during signup:', referralError);
      }
    }

    // Generate referral code for new user
    userReferralCode = generateReferralCode(email);

    // Create user profile with referral data
    try {
      console.log('🔧 Creating user profile for:', signUpData.user.id, 'with referrer:', referredByUserId);
      
      // Create absolute minimal user profile first
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: signUpData.user.id,
          email: email,
          full_name: email.split('@')[0]
        });

      if (profileError) {
        console.error('❌ Failed to create basic user profile:', profileError);
      } else {
        console.log('✅ Basic user profile created');
        
        // Now update with referral data if we have a referrer
        if (referredByUserId) {
          console.log('🔧 Updating profile with referral data:', referredByUserId);
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ referred_by_user_id: referredByUserId })
            .eq('user_id', signUpData.user.id);
            
          if (updateError) {
            console.error('❌ Failed to update profile with referral:', updateError);
          } else {
            console.log('✅ Profile updated with referral data');
          }
        }
      }

      // Create referral record if user was referred and profile creation succeeded
      if (!profileError && referredByUserId) {
        console.log('✅ User profile created with referral code:', userReferralCode);
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
    } catch (profileCreationError) {
      console.error('❌ Error creating user profile and referral data:', profileCreationError);
    }

    // Generate email confirmation link using admin API
    const redirectUrl = process.env.NODE_ENV === 'production' 
      ? 'https://bizzin.co.za/auth?verified=true' 
      : 'http://localhost:5000/auth?verified=true';

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      password: password,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (linkError || !linkData.properties?.action_link) {
      console.error('❌ Failed to generate confirmation link:', linkError);
      return res.status(500).json({ error: 'Failed to generate verification link' });
    }

    console.log('🔗 Generated confirmation link for:', email);

    // Send beautiful verification email using our custom template
    const emailSent = await simpleEmailScheduler.emailService.sendWelcomeEmail(
      email,
      linkData.properties.action_link
    );

    if (emailSent) {
      console.log(`✅ Beautiful verification email sent to ${email}`);
      
      let responseMessage = "Account created! Check your email for confirmation.";
      if (referralCode && isValidReferral) {
        responseMessage += " Welcome bonus applied - you'll get 30 days free when you upgrade!";
      } else if (referralCode && !isValidReferral) {
        responseMessage += " (Referral code not found)";
      } else {
        responseMessage += " Your 14-day free trial will begin when you confirm your email!";
      }

      res.json({ 
        success: true,
        message: responseMessage,
        user_id: signUpData.user.id,
        email_sent: true
      });
    } else {
      console.error(`❌ Failed to send verification email to ${email}`);
      
      // Even if email fails, user was created successfully
      res.json({ 
        success: true,
        message: "Account created but verification email failed to send. Please contact support.",
        user_id: signUpData.user.id,
        email_sent: false
      });
    }

  } catch (error) {
    console.error('❌ Server signup error:', error);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
});

// Resend verification email endpoint
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('📧 Resend verification request for:', email);

    // Check if user exists and is unverified
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      console.log('❌ User not found for resend verification:', email);
      // Don't reveal if user exists for security
      return res.json({ message: 'If an account with this email exists and is unverified, you will receive a verification email.' });
    }

    if (userData.email_confirmed_at) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new confirmation link using email recovery type
    const redirectUrl = process.env.NODE_ENV === 'production' 
      ? 'https://bizzin.co.za/auth?verified=true' 
      : 'http://localhost:5000/auth?verified=true';

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (linkError || !linkData.properties?.action_link) {
      console.error('❌ Failed to generate resend confirmation link:', linkError);
      return res.status(500).json({ error: 'Failed to generate verification link' });
    }

    // Send verification email using our beautiful template
    const emailSent = await simpleEmailScheduler.emailService.sendWelcomeEmail(
      email,
      linkData.properties.action_link
    );

    if (emailSent) {
      console.log(`✅ Verification email resent to ${email}`);
      res.json({ message: 'Verification email sent successfully' });
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