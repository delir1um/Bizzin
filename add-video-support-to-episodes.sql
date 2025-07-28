-- Add video support to podcast_episodes table
-- Execute this in the Supabase SQL Editor

-- Add video-related columns to podcast_episodes table
ALTER TABLE podcast_episodes 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail TEXT,
ADD COLUMN IF NOT EXISTS has_video BOOLEAN DEFAULT FALSE;

-- Create index for faster video episode queries
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_has_video ON podcast_episodes(has_video);

-- Update existing episodes to have has_video = false where it's null
UPDATE podcast_episodes 
SET has_video = FALSE 
WHERE has_video IS NULL;

-- Make has_video NOT NULL with default FALSE
ALTER TABLE podcast_episodes 
ALTER COLUMN has_video SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN podcast_episodes.video_url IS 'URL of the video file stored in Cloudflare R2';
COMMENT ON COLUMN podcast_episodes.video_thumbnail IS 'URL of the video thumbnail stored in Cloudflare R2';
COMMENT ON COLUMN podcast_episodes.has_video IS 'Boolean flag indicating if episode has video content';