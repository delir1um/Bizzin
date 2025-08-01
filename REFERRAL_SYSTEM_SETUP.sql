-- Referral System Setup for Bizzin
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Create referrals table to track referral relationships
CREATE TABLE referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE, -- true when referee has paid plan
    signup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activation_date TIMESTAMP WITH TIME ZONE, -- when referee first subscribed
    deactivation_date TIMESTAMP WITH TIME ZONE, -- when referee cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referee_id), -- prevent duplicate referrals
    UNIQUE(referee_id) -- each user can only be referred once
);

-- 2. Create user_referral_stats table for tracking referral benefits
CREATE TABLE user_referral_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    referral_code TEXT NOT NULL UNIQUE, -- user's unique referral code
    total_referrals INTEGER DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    bonus_days_earned INTEGER DEFAULT 0, -- total days earned (10 per active referral)
    bonus_days_used INTEGER DEFAULT 0, -- days already applied to subscription
    subscription_extension_until DATE, -- date until which subscription is extended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add referral tracking to user_plans table (if it doesn't exist, create it)
CREATE TABLE IF NOT EXISTS user_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
    subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    original_end_date TIMESTAMP WITH TIME ZONE, -- end date without referral bonuses
    referral_extension_days INTEGER DEFAULT 0, -- days added through referrals
    paystack_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referral_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for referrals
CREATE POLICY "Users can view referrals they made or received" ON referrals
FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can insert referrals they make" ON referrals
FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "System can update referral status" ON referrals
FOR UPDATE USING (true); -- Allow system updates for activation/deactivation

-- 6. Create RLS Policies for user_referral_stats
CREATE POLICY "Users can view own referral stats" ON user_referral_stats
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral stats" ON user_referral_stats
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own referral stats" ON user_referral_stats
FOR UPDATE USING (auth.uid() = user_id);

-- 7. Create RLS Policies for user_plans
CREATE POLICY "Users can view own plan" ON user_plans
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plan" ON user_plans
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plan" ON user_plans
FOR UPDATE USING (auth.uid() = user_id);

-- 8. Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate 8-character code with user ID hash + random
        code := UPPER(SUBSTRING(MD5(user_id::TEXT || counter::TEXT || EXTRACT(EPOCH FROM NOW())::TEXT), 1, 8));
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM user_referral_stats WHERE referral_code = code) THEN
            RETURN code;
        END IF;
        
        counter := counter + 1;
        -- Prevent infinite loop
        IF counter > 100 THEN
            RAISE EXCEPTION 'Could not generate unique referral code';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to automatically create referral stats for new users
CREATE OR REPLACE FUNCTION handle_new_user_referral_setup()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
BEGIN
    -- Generate unique referral code
    new_code := generate_referral_code(NEW.id);
    
    -- Create referral stats record
    INSERT INTO user_referral_stats (user_id, referral_code)
    VALUES (NEW.id, new_code);
    
    -- Create or update user plan record
    INSERT INTO user_plans (user_id, plan_type)
    VALUES (NEW.id, 'free')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger to setup referral system for new users
DROP TRIGGER IF EXISTS on_auth_user_created_referral ON auth.users;
CREATE TRIGGER on_auth_user_created_referral
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_referral_setup();

-- 11. Create function to update referral benefits when subscription status changes
CREATE OR REPLACE FUNCTION update_referral_benefits()
RETURNS TRIGGER AS $$
DECLARE
    referrer_record RECORD;
    days_to_add INTEGER;
    days_to_remove INTEGER;
BEGIN
    -- Check if this is a subscription status change
    IF OLD.subscription_status != NEW.subscription_status THEN
        
        -- Handle activation (free -> premium or inactive -> active)
        IF NEW.subscription_status = 'active' AND (OLD.subscription_status = 'inactive' OR OLD.plan_type = 'free') THEN
            -- Find if this user was referred
            SELECT * INTO referrer_record FROM referrals WHERE referee_id = NEW.user_id;
            
            IF FOUND THEN
                -- Activate the referral
                UPDATE referrals 
                SET is_active = true, activation_date = NOW(), updated_at = NOW()
                WHERE referee_id = NEW.user_id;
                
                -- Add 10 days to referrer's benefits
                UPDATE user_referral_stats 
                SET 
                    active_referrals = active_referrals + 1,
                    bonus_days_earned = bonus_days_earned + 10,
                    updated_at = NOW()
                WHERE user_id = referrer_record.referrer_id;
                
                -- Update referrer's subscription extension
                UPDATE user_plans 
                SET 
                    referral_extension_days = referral_extension_days + 10,
                    subscription_end_date = COALESCE(original_end_date, subscription_end_date, NOW()::DATE) + INTERVAL '1 day' * (referral_extension_days + 10),
                    updated_at = NOW()
                WHERE user_id = referrer_record.referrer_id;
            END IF;
        END IF;
        
        -- Handle deactivation (premium -> free or active -> inactive/cancelled)
        IF (NEW.subscription_status IN ('inactive', 'cancelled') OR NEW.plan_type = 'free') 
           AND OLD.subscription_status = 'active' THEN
            -- Find if this user was referred
            SELECT * INTO referrer_record FROM referrals WHERE referee_id = NEW.user_id AND is_active = true;
            
            IF FOUND THEN
                -- Deactivate the referral
                UPDATE referrals 
                SET is_active = false, deactivation_date = NOW(), updated_at = NOW()
                WHERE referee_id = NEW.user_id;
                
                -- Remove 10 days from referrer's benefits
                UPDATE user_referral_stats 
                SET 
                    active_referrals = GREATEST(0, active_referrals - 1),
                    bonus_days_earned = GREATEST(0, bonus_days_earned - 10),
                    updated_at = NOW()
                WHERE user_id = referrer_record.referrer_id;
                
                -- Update referrer's subscription extension
                UPDATE user_plans 
                SET 
                    referral_extension_days = GREATEST(0, referral_extension_days - 10),
                    subscription_end_date = COALESCE(original_end_date, subscription_end_date - INTERVAL '10 days', NOW()::DATE) + INTERVAL '1 day' * GREATEST(0, referral_extension_days - 10),
                    updated_at = NOW()
                WHERE user_id = referrer_record.referrer_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create trigger to automatically update referral benefits
DROP TRIGGER IF EXISTS on_subscription_change ON user_plans;
CREATE TRIGGER on_subscription_change
    AFTER UPDATE ON user_plans
    FOR EACH ROW EXECUTE FUNCTION update_referral_benefits();

-- 13. Create indexes for better performance
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_active ON referrals(is_active);
CREATE INDEX idx_user_referral_stats_user_id ON user_referral_stats(user_id);
CREATE INDEX idx_user_referral_stats_code ON user_referral_stats(referral_code);
CREATE INDEX idx_user_plans_user_id ON user_plans(user_id);

-- 14. Create view for easy referral dashboard queries
CREATE OR REPLACE VIEW user_referral_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    urs.referral_code,
    urs.total_referrals,
    urs.active_referrals,
    urs.bonus_days_earned,
    urs.bonus_days_used,
    up.subscription_end_date,
    up.referral_extension_days,
    COALESCE(urs.bonus_days_earned - urs.bonus_days_used, 0) as available_bonus_days,
    CASE 
        WHEN up.plan_type = 'premium' AND up.subscription_status = 'active' THEN 'Premium Active'
        WHEN up.plan_type = 'premium' AND up.subscription_status != 'active' THEN 'Premium Inactive'
        ELSE 'Free'
    END as plan_status
FROM auth.users u
LEFT JOIN user_referral_stats urs ON u.id = urs.user_id
LEFT JOIN user_plans up ON u.id = up.user_id;

-- 15. Grant necessary permissions
GRANT SELECT ON user_referral_dashboard TO authenticated;