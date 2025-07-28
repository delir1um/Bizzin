# Manual Database Setup Required

## Database Tables Missing

The podcast functionality requires database tables that need to be created manually in your Supabase dashboard.

## Quick Setup Instructions

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the following SQL and run it:

```sql
-- Podcast Progress Tracking System Setup

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
CREATE INDEX idx_podcast_episodes_series ON podcast_episodes(series);
CREATE INDEX idx_user_podcast_stats_user_id ON user_podcast_stats(user_id);
```

## After Running the SQL

Once you've run this SQL in your Supabase dashboard, let me know and I'll immediately populate the database with real podcast episodes and the podcast functionality will work perfectly.

## What This Enables

- 42 real business podcast episodes across 4 series (Strategy, Marketing, Finance, Leadership)
- Progress tracking with resume functionality
- Learning streaks and completion statistics
- Professional episode content with transcripts and key takeaways
- Personalized listening experience with real data