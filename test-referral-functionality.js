// Test script to check referral functionality
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testReferralSystem() {
  console.log('🧪 Testing Referral System Functionality...\n')

  try {
    // Test 1: Check if referral tables exist
    console.log('1. Checking referral tables...')
    
    const { data: referralStats, error: statsError } = await supabase
      .from('user_referral_stats')
      .select('count(*)')
      .limit(1)
    
    if (statsError) {
      console.error('❌ user_referral_stats table error:', statsError.message)
      return
    }
    console.log('✅ user_referral_stats table exists')

    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('count(*)')
      .limit(1)
    
    if (referralsError) {
      console.error('❌ referrals table error:', referralsError.message)
      return
    }
    console.log('✅ referrals table exists')

    // Test 2: Check dashboard view
    console.log('\n2. Checking dashboard view...')
    
    const { data: dashboard, error: dashboardError } = await supabase
      .from('user_referral_dashboard')
      .select('*')
      .limit(1)
    
    if (dashboardError) {
      console.error('❌ dashboard view error:', dashboardError.message)
      return
    }
    console.log('✅ user_referral_dashboard view exists')

    // Test 3: Check current user data
    console.log('\n3. Checking user authentication...')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('ℹ️ No authenticated user (this is normal for testing)')
    } else {
      console.log('✅ User authenticated:', user.email)
      
      // Test user's referral data
      const { data: userStats, error: userStatsError } = await supabase
        .from('user_referral_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (userStatsError) {
        console.log('ℹ️ User referral stats not found (may need to trigger user setup)')
      } else {
        console.log('✅ User referral code:', userStats.referral_code)
      }
    }

    // Test 4: Check referral code validation
    console.log('\n4. Testing referral code validation...')
    
    const { data: codeCheck, error: codeError } = await supabase
      .from('user_referral_stats')
      .select('user_id, referral_code')
      .eq('referral_code', 'TEST1234')
      .maybeSingle()
    
    if (codeError) {
      console.error('❌ Code validation error:', codeError.message)
    } else if (codeCheck) {
      console.log('✅ Found test referral code:', codeCheck.referral_code)
    } else {
      console.log('ℹ️ Test code TEST1234 not found (expected)')
    }

    console.log('\n🎉 Referral system basic functionality test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testReferralSystem()