-- Create the missing update_podcast_progress function in Supabase
-- Run this SQL command in your Supabase SQL Editor

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
    -- Get current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Determine if episode is completed (95% threshold)
    v_completed := (p_progress_seconds >= (p_episode_duration * 0.95));
    
    -- Insert or update progress
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_podcast_progress(UUID, INTEGER, INTEGER) TO authenticated;