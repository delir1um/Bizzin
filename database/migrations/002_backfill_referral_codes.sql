-- Migration: Backfill Referral Codes for Existing Users
-- This script adds referral codes to all existing users who don't have them
-- Run this AFTER 001_referral_system_schema.sql

-- Backfill referral codes for existing users who don't have them
UPDATE public.user_profiles 
SET referral_code = public.generate_referral_code(email)
WHERE referral_code IS NULL 
AND email IS NOT NULL;

-- Handle any potential conflicts by making codes unique
-- Create a sequence number for any duplicate codes
DO $$
DECLARE
  dup_group RECORD;
  dup_row RECORD;
  new_code TEXT;
  counter INTEGER;
BEGIN
  -- Find and fix any duplicate referral codes
  FOR dup_group IN
    SELECT referral_code, COUNT(*) as count
    FROM public.user_profiles 
    WHERE referral_code IS NOT NULL
    GROUP BY referral_code 
    HAVING COUNT(*) > 1
  LOOP
    counter := 1;
    -- Update duplicates with sequential suffixes
    FOR dup_row IN
      SELECT user_id, email, referral_code
      FROM public.user_profiles 
      WHERE referral_code = dup_group.referral_code
      ORDER BY created_at
      OFFSET 1  -- Skip the first one, keep it as-is
    LOOP
      -- Generate new code with counter
      new_code := public.generate_referral_code(dup_row.email || counter::text);
      
      -- Ensure uniqueness by checking if new code exists
      WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE referral_code = new_code) LOOP
        counter := counter + 1;
        new_code := public.generate_referral_code(dup_row.email || counter::text);
      END LOOP;
      
      -- Update the duplicate
      UPDATE public.user_profiles 
      SET referral_code = new_code 
      WHERE user_id = dup_row.user_id;
      
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Add NOT NULL constraint after backfilling
ALTER TABLE public.user_profiles 
ALTER COLUMN referral_code SET NOT NULL;