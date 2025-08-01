# Referral System Setup Instructions

## Overview
The referral system allows users to earn 10 days of free subscription for each successful paid referral. This document outlines the setup and implementation details.

## Database Setup Required

### Step 1: Run SQL Setup
Execute the SQL commands in `REFERRAL_SYSTEM_SETUP.sql` in your Supabase SQL Editor. This will create:

- `referrals` table - tracks referral relationships
- `user_referral_stats` table - stores user referral statistics and codes
- `user_plans` table - manages user subscription plans with referral extensions
- Database triggers for automatic referral activation/deactivation
- RLS policies for data security
- Helper functions for referral code generation

### Step 2: Enable Database Functions
The setup includes several PostgreSQL functions:
- `generate_referral_code()` - creates unique 8-character referral codes
- `handle_new_user_referral_setup()` - automatically creates referral stats for new users
- `update_referral_benefits()` - manages referral benefits when subscription status changes

### Step 3: Verify Setup
After running the SQL, verify the setup by checking:
1. Tables exist: `referrals`, `user_referral_stats`, `user_plans`
2. View exists: `user_referral_dashboard`
3. Triggers are active: `on_auth_user_created_referral`, `on_subscription_change`

## How the System Works

### 1. User Registration with Referrals
- Referral codes are detected from URL parameters (?ref=XXXXXXXX)
- Valid referral codes switch the auth page to signup mode
- Referral relationships are created during signup process

### 2. Referral Activation
- Referrals activate automatically when the referee subscribes to a paid plan
- Database triggers handle the activation and benefit calculation
- Referrers receive 10 days added to their subscription extension

### 3. Referral Deactivation
- If a referee cancels their subscription, referral benefits are removed
- Database triggers handle automatic deactivation
- Referrer's subscription extension is reduced accordingly

### 4. Benefit Calculation
- Each active referral = 10 days of subscription extension
- Benefits stack (10 referrals = 100 days free)
- Extensions are applied to the `subscription_end_date` in user_plans

## Frontend Implementation

### Components Created
- `ReferralDashboard` - Main referral management interface
- `ReferralStatsCard` - Dashboard widget showing referral overview
- `ReferralsPage` - Dedicated page for referral management
- Enhanced `AuthPage` - Handles referral code detection and signup

### Services
- `ReferralService` - Complete API service for referral operations
- Methods for code validation, referral processing, stats retrieval

### Navigation
- Referrals link added to main navigation (authenticated users only)
- Route protection ensures only logged-in users can access referral features

## Key Features Implemented

### Referral Dashboard
- Real-time referral statistics
- Referral link generation and copying
- Referral history with activation status
- Visual progress indicators
- How-it-works explanation

### Authentication Enhancement
- Automatic referral code detection from URLs
- Visual indication when signing up via referral
- Referral processing during account creation

### Database Security
- Row Level Security (RLS) policies protect user data
- Users can only access their own referral information
- System triggers ensure data consistency

## Technical Notes

### Referral Code Format
- 8-character alphanumeric codes (uppercase)
- Generated using MD5 hash of user ID + timestamp
- Uniqueness verified before assignment

### Subscription Integration
- Compatible with existing plan system
- Works with Paystack subscription webhooks
- Maintains backward compatibility

### Performance Considerations
- Database indexes on key lookup fields
- Efficient queries using the `user_referral_dashboard` view
- Minimal impact on existing authentication flow

## Testing the System

### Manual Testing Steps
1. Create a user account (referral stats auto-created)
2. Copy referral link from dashboard
3. Open referral link in incognito window
4. Sign up new account (should show referral indicator)
5. Upgrade referee to paid plan (referrer should gain 10 days)
6. Cancel referee subscription (referrer should lose 10 days)

### Monitoring
- Check database triggers are firing correctly
- Monitor referral activation/deactivation logs
- Verify subscription extension calculations

## Future Enhancements
- Email notifications for referral events
- Referral analytics and reporting
- Tiered referral rewards
- Social sharing integrations
- Referral leaderboards

## Support
For issues with the referral system:
1. Check database trigger logs
2. Verify RLS policies are active
3. Ensure Supabase functions are properly deployed
4. Review subscription webhook integration