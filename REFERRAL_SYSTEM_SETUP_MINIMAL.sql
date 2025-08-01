-- Minimal Referral System Setup for Existing Database
-- Run this if you get "already exists" errors with the main setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create referrals table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.referrals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    referee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code text NOT NULL,
    is_active boolean DEFAULT false,
    signup_date timestamp with time zone DEFAULT now(),
    activation_date timestamp with time zone,
    deactivation_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(referrer_id, referee_id)
);

-- 2. Create user_referral_stats table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.user_referral_stats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email text,
    referral_code text UNIQUE NOT NULL,
    total_referrals integer DEFAULT 0,
    active_referrals integer DEFAULT 0,
    bonus_days_earned integer DEFAULT 0,
    bonus_days_used integer DEFAULT 0,
    available_bonus_days integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Add referral columns to user_plans table (if they don't exist)
DO $$ 
BEGIN
    -- Add referral_extension_days column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_plans' 
                   AND column_name = 'referral_extension_days') THEN
        ALTER TABLE public.user_plans 
        ADD COLUMN referral_extension_days integer DEFAULT 0;
    END IF;
    
    -- Add original_end_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_plans' 
                   AND column_name = 'original_end_date') THEN
        ALTER TABLE public.user_plans 
        ADD COLUMN original_end_date timestamp with time zone;
    END IF;
END $$;

-- 4. Create referral code generation function
CREATE OR REPLACE FUNCTION generate_referral_code(user_id_input uuid)
RETURNS text AS $$
DECLARE
    code text;
    exists_check boolean;
BEGIN
    LOOP
        -- Generate 8-character code using MD5 hash
        code := UPPER(SUBSTRING(MD5(user_id_input::text || extract(epoch from now())::text) FROM 1 FOR 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM user_referral_stats WHERE referral_code = code) INTO exists_check;
        
        -- If unique, return the code
        IF NOT exists_check THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Create user referral dashboard view
CREATE OR REPLACE VIEW user_referral_dashboard AS
SELECT 
    urs.user_id,
    urs.email,
    urs.referral_code,
    urs.total_referrals,
    urs.active_referrals,
    urs.bonus_days_earned,
    urs.bonus_days_used,
    urs.available_bonus_days,
    up.plan_status,
    up.subscription_end_date,
    up.referral_extension_days
FROM user_referral_stats urs
LEFT JOIN user_plans up ON urs.user_id = up.user_id;

-- 6. Function to handle new user referral setup
CREATE OR REPLACE FUNCTION handle_new_user_referral_setup()
RETURNS trigger AS $$
DECLARE
    new_code text;
BEGIN
    -- Generate unique referral code
    new_code := generate_referral_code(NEW.id);
    
    -- Insert referral stats record
    INSERT INTO public.user_referral_stats (
        user_id, 
        email, 
        referral_code
    ) VALUES (
        NEW.id,
        NEW.email,
        new_code
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to update referral benefits
CREATE OR REPLACE FUNCTION update_referral_benefits()
RETURNS trigger AS $$
DECLARE
    referrer_record RECORD;
    total_active_referrals integer;
    new_extension_days integer;
BEGIN
    -- Handle subscription status changes
    IF TG_OP = 'UPDATE' AND OLD.plan_status != NEW.plan_status THEN
        -- Check if this user was referred by someone
        SELECT r.referrer_id INTO referrer_record
        FROM referrals r 
        WHERE r.referee_id = NEW.user_id;
        
        IF FOUND THEN
            IF NEW.plan_status = 'Premium' AND OLD.plan_status = 'Free' THEN
                -- Activate referral
                UPDATE referrals 
                SET is_active = true, activation_date = now()
                WHERE referee_id = NEW.user_id;
                
                -- Update referrer stats
                UPDATE user_referral_stats 
                SET 
                    active_referrals = active_referrals + 1,
                    bonus_days_earned = bonus_days_earned + 10,
                    available_bonus_days = available_bonus_days + 10
                WHERE user_id = referrer_record.referrer_id;
                
            ELSIF NEW.plan_status = 'Free' AND OLD.plan_status = 'Premium' THEN
                -- Deactivate referral
                UPDATE referrals 
                SET is_active = false, deactivation_date = now()
                WHERE referee_id = NEW.user_id;
                
                -- Update referrer stats
                UPDATE user_referral_stats 
                SET 
                    active_referrals = GREATEST(0, active_referrals - 1),
                    bonus_days_earned = GREATEST(0, bonus_days_earned - 10),
                    available_bonus_days = GREATEST(0, available_bonus_days - 10)
                WHERE user_id = referrer_record.referrer_id;
            END IF;
            
            -- Recalculate total extension days for referrer
            SELECT COALESCE(COUNT(*) * 10, 0) INTO new_extension_days
            FROM referrals 
            WHERE referrer_id = referrer_record.referrer_id AND is_active = true;
            
            UPDATE user_plans 
            SET referral_extension_days = new_extension_days
            WHERE user_id = referrer_record.referrer_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create triggers (drop first if they exist)
DROP TRIGGER IF EXISTS on_auth_user_created_referral ON auth.users;
CREATE TRIGGER on_auth_user_created_referral
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_referral_setup();

DROP TRIGGER IF EXISTS on_subscription_change ON public.user_plans;
CREATE TRIGGER on_subscription_change
    AFTER UPDATE ON public.user_plans
    FOR EACH ROW EXECUTE FUNCTION update_referral_benefits();

-- 9. Enable Row Level Security
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referral_stats ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies (drop first if they exist)

-- Referrals policies
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
CREATE POLICY "Users can view their own referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users can insert their own referrals" ON public.referrals;
CREATE POLICY "Users can insert their own referrals" ON public.referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "System can update referrals" ON public.referrals;
CREATE POLICY "System can update referrals" ON public.referrals
    FOR UPDATE USING (true);

-- User referral stats policies
DROP POLICY IF EXISTS "Users can view own referral stats" ON public.user_referral_stats;
CREATE POLICY "Users can view own referral stats" ON public.user_referral_stats
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own referral stats" ON public.user_referral_stats;
CREATE POLICY "Users can update own referral stats" ON public.user_referral_stats
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert referral stats" ON public.user_referral_stats;
CREATE POLICY "System can insert referral stats" ON public.user_referral_stats
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update referral stats" ON public.user_referral_stats;
CREATE POLICY "System can update referral stats" ON public.user_referral_stats
    FOR UPDATE USING (true);

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON public.referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_referral_stats_user_id ON public.user_referral_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_referral_stats_code ON public.user_referral_stats(referral_code);

-- 12. Insert referral stats for existing users (if they don't have them)
INSERT INTO public.user_referral_stats (user_id, email, referral_code)
SELECT 
    au.id,
    au.email,
    generate_referral_code(au.id)
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_referral_stats urs 
    WHERE urs.user_id = au.id
);

COMMIT;