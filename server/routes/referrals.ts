import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Test endpoint to see what the server can access
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing server database connection...');
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, email, referral_code')
      .limit(5);
    
    console.log('🧪 Test query result:', { 
      success: !error, 
      error: error?.message, 
      dataCount: data?.length,
      data: data?.map(u => ({ email: u.email, code: u.referral_code }))
    });
    
    return res.json({ 
      success: !error, 
      error: error?.message,
      dataCount: data?.length || 0,
      referralCodes: data?.map(u => ({ email: u.email, code: u.referral_code })) || []
    });
  } catch (error) {
    console.error('💥 Test error:', error);
    return res.status(500).json({ error: 'Test failed' });
  }
});

// Validate referral code endpoint
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code || code.trim() === '') {
      return res.json({ valid: false, error: 'No referral code provided' });
    }

    console.log('🔍 Validating referral code:', code);

    // Query the database using server-side Supabase client (has proper permissions)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, referral_code')
      .eq('referral_code', code.trim().toUpperCase())
      .single();

    if (error || !data) {
      console.log('❌ Referral code not found:', code, 'Error:', error?.message);
      return res.json({ valid: false, error: 'Referral code not found' });
    }

    console.log('✅ Valid referral code found:', { code, referrer: data.email });
    return res.json({ 
      valid: true, 
      referrer: {
        user_id: data.user_id,
        email: data.email,
        name: data.full_name
      }
    });

  } catch (error) {
    console.error('💥 Error validating referral code:', error);
    return res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});

export default router;