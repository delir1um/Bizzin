# Plan System Implementation Guide

## Overview
The plan system has been implemented to differentiate between free and premium users across the Bizzin platform with usage limits and upgrade prompts.

## Database Setup Required

### Step 1: Execute SQL Schema
Execute the SQL commands in `PLAN_SYSTEM_SETUP.sql` in your Supabase SQL Editor to create:
- `user_plans` table - tracks user subscription status
- `usage_limits` table - tracks monthly usage per user
- `plan_limits` view - defines limits for each plan type
- RLS policies for data security
- Functions for auto-creating plans and managing usage

### Step 2: Verify Tables Created
After running the SQL, verify these tables exist in your Supabase dashboard:
- `user_plans`
- `usage_limits`

## Plan Limits Implemented

### Free Tier
- **Storage**: 500MB limit
- **File Size**: 50MB max per file
- **Documents**: 20 uploads per month
- **Journal**: 10 entries per month  
- **Goals**: 5 active goals maximum
- **BizBuilder**: 3 calculations per day per tool

### Premium Tier ($9.99/month)
- **Storage**: 10GB limit
- **File Size**: 100MB max per file
- **Documents**: Unlimited uploads
- **Journal**: Unlimited entries
- **Goals**: Unlimited goals
- **BizBuilder**: Unlimited calculations

## Components Added

### Core Services
- `PlansService` - handles all plan and usage operations
- `usePlans` hook - React hook for plan management
- `PlanLimitBanner` - shows usage warnings near limits
- `UpgradeModal` - upgrade prompt with feature comparison

### Integration Points
- **DocSafe**: Upload limits, storage warnings, upgrade prompts
- **Goals**: Goal creation limits (ready for integration)
- **Journal**: Entry creation limits (ready for integration)
- **BizBuilder**: Calculator usage limits (ready for integration)

## Current Status
- ✅ Database schema created
- ✅ Plan service and types implemented
- ✅ UI components for limits and upgrades created
- ✅ DocSafe integration completed
- ⏳ Database setup required (run SQL script)
- ⏳ Goals page integration pending
- ⏳ Journal page integration pending
- ⏳ BizBuilder integration pending

## Usage Tracking
The system automatically tracks:
- Document uploads and storage used
- Journal entries created per month
- Goals created (total active)
- Calculator uses per day per tool

## Next Steps
1. Execute `PLAN_SYSTEM_SETUP.sql` in Supabase
2. Test plan limits in DocSafe
3. Integrate limits into Goals, Journal, and BizBuilder pages
4. Add payment processing for actual premium upgrades