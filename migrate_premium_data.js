#!/usr/bin/env node

// Migrate premium plan data from Neon TO Supabase
// This script copies anton@cloudfusion.co.za's premium plan data to Supabase

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migratePremiumData() {
  try {
    console.log('🚀 Starting premium data migration to Supabase...');
    
    // 1. Insert user profile
    console.log('📝 Creating user profile...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: '9502ea97-1adb-4115-ba05-1b6b1b5fa721',
        email: 'anton@cloudfusion.co.za',
        full_name: 'Anton Bosch',
        business_name: 'CloudFusion',
        first_name: 'Anton',
        last_name: 'Vorster',
        business_type: 'Technology Solutions',
        is_admin: true,
        created_at: '2025-07-22T18:19:16.489549+00:00',
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      return;
    }
    console.log('✅ User profile created successfully');

    // 2. Insert premium plan
    console.log('💎 Creating premium plan...');
    const { error: planError } = await supabase
      .from('user_plans')
      .upsert({
        id: '968a00c9-8faf-4e16-ad68-b480ef6b3044',
        user_id: '9502ea97-1adb-4115-ba05-1b6b1b5fa721',
        plan_type: 'premium',
        billing_cycle: null,
        amount_paid: null,
        currency: null,
        paystack_customer_code: null,
        paystack_subscription_code: null,
        started_at: '2025-09-23T08:55:31.932257+00:00',
        expires_at: '2025-10-07T08:55:31.932257+00:00',
        cancelled_at: null,
        referral_days_remaining: null,
        created_at: '2025-09-23T08:55:31.932257+00:00',
        updated_at: '2025-09-23T15:03:29.265587+00:00',
        is_trial: false,
        trial_ends_at: null,
        referral_bonus_applied: false,
        payment_status: 'active',
        grace_period_end: null,
        last_payment_date: null,
        next_payment_date: null,
        failed_payment_count: 0
      });

    if (planError) {
      console.error('❌ Plan creation error:', planError);
      return;
    }
    console.log('✅ Premium plan created successfully');

    // 3. Verify the migration
    console.log('🔍 Verifying migration...');
    const { data: verifyProfile } = await supabase
      .from('user_profiles')
      .select('email, full_name, business_name')
      .eq('user_id', '9502ea97-1adb-4115-ba05-1b6b1b5fa721')
      .single();

    const { data: verifyPlan } = await supabase
      .from('user_plans')
      .select('plan_type, payment_status, expires_at')
      .eq('user_id', '9502ea97-1adb-4115-ba05-1b6b1b5fa721')
      .single();

    console.log('✅ Migration verification:');
    console.log('👤 Profile:', verifyProfile);
    console.log('💎 Plan:', verifyPlan);

    console.log('🎉 Premium data migration completed successfully!');
    console.log('🔄 Please restart your application to see the changes.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migratePremiumData();