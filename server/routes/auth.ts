import express from 'express';
import { supabase } from '../lib/supabase.js';
import { simpleEmailScheduler } from '../services/SimpleEmailScheduler.js';

const router = express.Router();

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

    // Store referral code for processing during profile creation if valid
    if (referralCode && isValidReferral) {
      try {
        // Store the pending referral in a simple way for the auth provider to pick up
        const tempStorage: Map<string, string> = (globalThis as any).pendingReferrals || new Map();
        tempStorage.set(signUpData.user.id, referralCode);
        (globalThis as any).pendingReferrals = tempStorage;
        console.log('✅ Referral code stored for user:', signUpData.user.id);
      } catch (referralError) {
        console.error('Error storing referral code:', referralError);
        // Continue with signup even if referral storage fails
      }
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