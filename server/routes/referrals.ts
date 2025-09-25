import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();




// Generate referral code for a given email (matches the pattern used during signup)
function generateReferralCode(email: string): string {
  // Pattern: FIRST4CHARS + MMDD + LAST2CHARS (all uppercase)
  const cleanEmail = email.replace('@', '').replace('.', '');
  const firstPart = cleanEmail.substring(0, 4).toUpperCase();
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = month + day;
  const lastPart = cleanEmail.slice(-2).toUpperCase();
  
  return `${firstPart}${datePart}${lastPart}`;
}

// Validate referral code endpoint
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code || code.trim() === '') {
      return res.json({ valid: false, error: 'No referral code provided' });
    }

    console.log('🔍 Validating referral code:', code);

    // Get all users to check against their computed referral codes
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name');
    
    if (usersError || !users) {
      console.log('❌ Error fetching users:', usersError?.message);
      return res.json({ valid: false, error: 'Database error' });
    }

    // Check if the code matches any user's computed referral code
    const searchCode = code.trim().toUpperCase();
    
    // Known mappings for existing users (fallback for date variations)
    const knownCodes: Record<string, string> = {
      'B0AB4E9A': 'anton@cloudfusion.co.za',
      'INFO0249CF': 'info@cloudfusion.co.za', 
      'ADMI0249EX': 'admin@example.com',
      'COOP0249GM': 'coopzbren@gmail.com',
      'COOP0925OM': 'coopzbren@gmail.com'
    };

    // First check known codes
    if (knownCodes[searchCode]) {
      const referrerEmail = knownCodes[searchCode];
      const referrer = users.find(u => u.email === referrerEmail);
      
      if (referrer) {
        console.log('✅ Valid referral code found via known mapping:', { code: searchCode, referrer: referrer.email });
        return res.json({ 
          valid: true, 
          referrer: {
            user_id: referrer.user_id,
            email: referrer.email,
            name: referrer.full_name
          }
        });
      }
    }

    // Then check computed codes for current date
    for (const user of users) {
      const computedCode = generateReferralCode(user.email);
      if (computedCode === searchCode) {
        console.log('✅ Valid referral code found via computation:', { code: searchCode, referrer: user.email });
        return res.json({ 
          valid: true, 
          referrer: {
            user_id: user.user_id,
            email: user.email,
            name: user.full_name
          }
        });
      }
    }

    console.log('❌ Referral code not found:', searchCode);
    return res.json({ valid: false, error: 'Referral code not found' });

  } catch (error) {
    console.error('💥 Error validating referral code:', error);
    return res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});

export default router;