-- Podcast Progress Tracking System Setup
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Create podcast_episodes table
CREATE TABLE podcast_episodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- duration in seconds
    series TEXT NOT NULL,
    series_color TEXT,
    episode_number INTEGER,
    audio_url TEXT,
    transcript TEXT,
    key_takeaways JSONB,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_podcast_progress table
CREATE TABLE user_podcast_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    episode_id UUID NOT NULL REFERENCES podcast_episodes(id) ON DELETE CASCADE,
    progress_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_listened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, episode_id)
);

-- 3. Create user_podcast_stats table for aggregated data
CREATE TABLE user_podcast_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_episodes_completed INTEGER DEFAULT 0,
    total_listening_time INTEGER DEFAULT 0, -- in seconds
    learning_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_streak_date DATE,
    favorite_series TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_podcast_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_podcast_stats ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies

-- Podcast episodes are readable by all authenticated users
CREATE POLICY "Podcast episodes are viewable by authenticated users" ON podcast_episodes
FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only access their own progress
CREATE POLICY "Users can view own podcast progress" ON user_podcast_progress
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own podcast progress" ON user_podcast_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own podcast progress" ON user_podcast_progress
FOR UPDATE USING (auth.uid() = user_id);

-- Users can only access their own stats
CREATE POLICY "Users can view own podcast stats" ON user_podcast_stats
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own podcast stats" ON user_podcast_stats
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own podcast stats" ON user_podcast_stats
FOR UPDATE USING (auth.uid() = user_id);

-- 6. Create indexes for better performance
CREATE INDEX idx_user_podcast_progress_user_id ON user_podcast_progress(user_id);
CREATE INDEX idx_user_podcast_progress_episode_id ON user_podcast_progress(episode_id);
CREATE INDEX idx_user_podcast_progress_completed ON user_podcast_progress(completed);
CREATE INDEX idx_user_podcast_progress_last_listened ON user_podcast_progress(last_listened_at);
CREATE INDEX idx_podcast_episodes_series ON podcast_episodes(series);

-- 7. Create functions for progress tracking

-- Function to update listening progress
CREATE OR REPLACE FUNCTION update_podcast_progress(
    p_episode_id UUID,
    p_progress_seconds INTEGER,
    p_episode_duration INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_completed BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    v_completed := (p_progress_seconds >= (p_episode_duration * 0.95)); -- 95% completion
    
    INSERT INTO user_podcast_progress (
        user_id, 
        episode_id, 
        progress_seconds, 
        completed,
        completed_at,
        last_listened_at,
        updated_at
    ) 
    VALUES (
        v_user_id, 
        p_episode_id, 
        p_progress_seconds, 
        v_completed,
        CASE WHEN v_completed THEN NOW() ELSE NULL END,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, episode_id) 
    DO UPDATE SET 
        progress_seconds = p_progress_seconds,
        completed = v_completed,
        completed_at = CASE 
            WHEN v_completed AND user_podcast_progress.completed = FALSE 
            THEN NOW() 
            ELSE user_podcast_progress.completed_at 
        END,
        last_listened_at = NOW(),
        updated_at = NOW();
        
    -- Update user stats if episode was just completed
    IF v_completed AND NOT EXISTS (
        SELECT 1 FROM user_podcast_progress 
        WHERE user_id = v_user_id AND episode_id = p_episode_id AND completed = TRUE
    ) THEN
        PERFORM update_user_podcast_stats(v_user_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user podcast statistics
CREATE OR REPLACE FUNCTION update_user_podcast_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_completed_count INTEGER;
    v_total_time INTEGER;
    v_current_streak INTEGER;
    v_last_completion_date DATE;
    v_favorite_series TEXT;
BEGIN
    -- Calculate completed episodes
    SELECT COUNT(*) INTO v_completed_count
    FROM user_podcast_progress 
    WHERE user_id = p_user_id AND completed = TRUE;
    
    -- Calculate total listening time
    SELECT COALESCE(SUM(pe.duration), 0) INTO v_total_time
    FROM user_podcast_progress upp
    JOIN podcast_episodes pe ON upp.episode_id = pe.id
    WHERE upp.user_id = p_user_id AND upp.completed = TRUE;
    
    -- Calculate current streak
    SELECT calculate_learning_streak(p_user_id) INTO v_current_streak;
    
    -- Find favorite series
    SELECT pe.series INTO v_favorite_series
    FROM user_podcast_progress upp
    JOIN podcast_episodes pe ON upp.episode_id = pe.id
    WHERE upp.user_id = p_user_id AND upp.completed = TRUE
    GROUP BY pe.series
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Get last completion date
    SELECT DATE(MAX(completed_at)) INTO v_last_completion_date
    FROM user_podcast_progress
    WHERE user_id = p_user_id AND completed = TRUE;
    
    -- Upsert user stats
    INSERT INTO user_podcast_stats (
        user_id,
        total_episodes_completed,
        total_listening_time,
        learning_streak,
        longest_streak,
        last_streak_date,
        favorite_series,
        updated_at
    ) VALUES (
        p_user_id,
        v_completed_count,
        v_total_time,
        v_current_streak,
        GREATEST(v_current_streak, COALESCE((SELECT longest_streak FROM user_podcast_stats WHERE user_id = p_user_id), 0)),
        v_last_completion_date,
        v_favorite_series,
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        total_episodes_completed = v_completed_count,
        total_listening_time = v_total_time,
        learning_streak = v_current_streak,
        longest_streak = GREATEST(v_current_streak, user_podcast_stats.longest_streak),
        last_streak_date = v_last_completion_date,
        favorite_series = v_favorite_series,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate learning streak
CREATE OR REPLACE FUNCTION calculate_learning_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 0;
    v_current_date DATE := CURRENT_DATE;
    v_check_date DATE;
BEGIN
    -- Start from today and go backwards
    v_check_date := v_current_date;
    
    LOOP
        -- Check if user completed any episode on this date
        IF EXISTS (
            SELECT 1 FROM user_podcast_progress 
            WHERE user_id = p_user_id 
            AND completed = TRUE 
            AND DATE(completed_at) = v_check_date
        ) THEN
            v_streak := v_streak + 1;
            v_check_date := v_check_date - INTERVAL '1 day';
        ELSE
            -- If we're checking today and no completion, streak might still be valid from yesterday
            IF v_check_date = v_current_date THEN
                v_check_date := v_check_date - INTERVAL '1 day';
                CONTINUE;
            ELSE
                EXIT; -- Streak broken
            END IF;
        END IF;
    END LOOP;
    
    RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Insert sample podcast episodes
INSERT INTO podcast_episodes (title, description, duration, series, series_color, episode_number, key_takeaways, difficulty) VALUES
-- Strategy Series
('The 15-Minute Business Model', 'Quick framework to validate your business idea and build a sustainable model that attracts customers and generates revenue from day one.', 900, 'Strategy', 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200', 1, '["Understand core value proposition", "Map customer segments", "Identify revenue streams"]', 'Intermediate'),
('Competitive Analysis Made Simple', 'Learn how to analyze your competition effectively and find your unique positioning in the market.', 1080, 'Strategy', 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200', 2, '["Identify direct competitors", "Analyze pricing strategies", "Find market gaps"]', 'Beginner'),
('Product-Market Fit Essentials', 'Discover the key indicators of product-market fit and how to achieve it faster than your competitors.', 960, 'Strategy', 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200', 3, '["Measure user engagement", "Track retention metrics", "Iterate based on feedback"]', 'Intermediate'),

-- Marketing Series  
('Digital Marketing on a Startup Budget', 'Cost-effective marketing strategies that deliver real results without breaking the bank.', 900, 'Marketing', 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200', 1, '["Free marketing channels", "Content marketing basics", "Social media automation"]', 'Beginner'),
('Content Marketing That Converts', 'Create content that engages your audience and drives meaningful business results.', 1020, 'Marketing', 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200', 2, '["Content strategy framework", "SEO optimization", "Conversion tracking"]', 'Intermediate'),
('Social Media Strategy for B2B', 'Build a professional social media presence that generates leads and builds authority.', 840, 'Marketing', 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200', 3, '["LinkedIn strategy", "B2B content types", "Lead generation tactics"]', 'Intermediate'),

-- Finance Series
('Cash Flow Crisis Management', 'Practical steps when money gets tight and how to navigate financial challenges successfully.', 900, 'Finance', 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200', 1, '["Emergency funding options", "Cost reduction strategies", "Negotiate payment terms"]', 'Intermediate'),
('Funding Options for Startups', 'Explore different funding strategies from bootstrapping to venture capital and everything in between.', 1140, 'Finance', 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200', 2, '["Bootstrap vs investment", "Pitch deck essentials", "Investor relations"]', 'Advanced'),
('Financial Planning for Growth', 'Build financial models and plans that support sustainable business growth and expansion.', 960, 'Finance', 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200', 3, '["Revenue forecasting", "Expense planning", "Growth metrics"]', 'Intermediate'),

-- Leadership Series
('Building Team Culture Remotely', 'Leadership tactics for distributed teams and creating strong company culture in a remote-first world.', 900, 'Leadership', 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200', 1, '["Remote communication", "Team building activities", "Culture documentation"]', 'Advanced'),
('Hiring Your First Employees', 'Navigate the challenges of hiring when resources are limited and every hire is critical.', 1080, 'Leadership', 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200', 2, '["Job description writing", "Interview techniques", "Onboarding process"]', 'Intermediate'),
('Difficult Conversations Made Easy', 'Master the art of having challenging conversations that build stronger relationships and better outcomes.', 960, 'Leadership', 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200', 3, '["Conflict resolution", "Feedback delivery", "Performance management"]', 'Advanced');

-- 9. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION update_podcast_progress(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_podcast_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_learning_streak(UUID) TO authenticated;