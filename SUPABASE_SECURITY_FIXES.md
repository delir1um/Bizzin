# Supabase Security Fixes Required

Based on the security lints from Supabase, here are the issues and how to fix them:

## Critical Issues to Fix

### 1. RLS Disabled on podcast_episodes Table

**Problem**: The `podcast_episodes` table has RLS policies but RLS is not enabled.

**Fix in Supabase Dashboard**:
1. Go to Database → Tables
2. Find `podcast_episodes` table
3. Click on the table settings (gear icon)
4. Enable "Row Level Security (RLS)"
5. Or run this SQL in the SQL Editor:
   ```sql
   ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;
   ```

### 2. Security Definer Views

**Problem**: Views `user_referral_dashboard` and `plan_limits` use SECURITY DEFINER.

**What this means**: These views run with the permissions of the user who created them (usually superuser), not the querying user.

**Fix Options**:
1. **Option A (Recommended)**: Change to SECURITY INVOKER:
   ```sql
   ALTER VIEW public.user_referral_dashboard SET (security_invoker = true);
   ALTER VIEW public.plan_limits SET (security_invoker = true);
   ```

2. **Option B**: If superuser permissions are needed, add proper RLS policies to the underlying tables.

## Quick Fix Steps

### In Supabase SQL Editor:

```sql
-- 1. Enable RLS on podcast_episodes
ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;

-- 2. Create a basic policy for podcast_episodes (adjust as needed)
CREATE POLICY "authenticated_read_podcast_episodes" 
ON public.podcast_episodes 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 3. Fix security definer views
ALTER VIEW public.user_referral_dashboard SET (security_invoker = true);
ALTER VIEW public.plan_limits SET (security_invoker = true);
```

## Verification

After applying fixes, run these queries to verify:

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'podcast_episodes';

-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'podcast_episodes';

-- Check view security settings
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE viewname IN ('user_referral_dashboard', 'plan_limits');
```

## Why This Matters

- **RLS Protection**: Ensures users can only access data they're authorized to see
- **Security Definer Risk**: Views with SECURITY DEFINER bypass normal access controls
- **Compliance**: Follows Supabase security best practices
- **Data Protection**: Prevents unauthorized data access

Apply these fixes in your Supabase dashboard to resolve all security warnings.