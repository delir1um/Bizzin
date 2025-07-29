# Cloudflare R2 Video Setup Guide

This guide will help you set up Cloudflare R2 for video hosting and streaming in the Bizzin podcast platform.

## Prerequisites

1. Cloudflare Account
2. Supabase Database Access
3. Video content files for podcast episodes

## Step 1: Set up Cloudflare R2 Bucket

1. **Create R2 Bucket:**
   - Log into Cloudflare Dashboard
   - Go to R2 Object Storage
   - Create bucket named `bizzin-podcasts`
   - Note your Account ID from the right sidebar

2. **Configure Bucket for Public Access:**
   - Click on your `bizzin-podcasts` bucket
   - Go to Settings tab
   - Under "Public access", enable public access
   - Copy the "Public bucket URL" (e.g., https://pub-b3498cd071e1420b9d379a5510ba4bb8.r2.dev)
   - This allows videos to be directly accessible via public URL

2. **Create API Token:**
   - Go to "Manage R2 API Tokens"
   - Click "Create API Token"
   - **IMPORTANT**: Select "Admin Read & Write" permissions (not just "Read & Write")
   - OR select "Custom" and enable:
     - Object read
     - Object write
     - Bucket read (required for ListBuckets)
     - Bucket write
   - Apply to all buckets or specific bucket: `bizzin-podcasts`
   - Note the Access Key ID and Secret Access Key

3. **Set up Custom Domain (Optional but Recommended):**
   - In bucket settings, connect a custom domain
   - This provides better CDN performance and branding
   - Example: `cdn.bizzin.com`

## Step 2: Environment Variables

Add these environment variables to your Replit secrets:

```
VITE_CLOUDFLARE_ACCOUNT_ID=your-account-id
VITE_CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
VITE_CLOUDFLARE_R2_BUCKET_NAME=bizzin-podcasts
VITE_CLOUDFLARE_R2_PUBLIC_DOMAIN=your-custom-domain.com
```

## Step 3: Database Migration

Execute the SQL migration in your Supabase SQL Editor:

```sql
-- Execute the contents of add-video-support-to-episodes.sql
-- This adds video_url, video_thumbnail, and has_video columns
```

## Step 4: Upload Video Content

Use the new `PodcastService.uploadEpisodeVideo()` method to upload videos:

```typescript
// Example: Upload video for an episode
await PodcastService.uploadEpisodeVideo(
  'episode-id', 
  videoFile, 
  thumbnailFile // optional
)
```

## Step 5: Test Video Playback

1. Upload a test video file
2. Verify the episode shows "Video" badge in the podcast list
3. Click the video/audio toggle button in the player
4. Confirm video plays with proper controls

## Cost Estimation

For 50 episodes with 10GB total video content:
- **Storage**: ~R2.70/month (10GB × R0.27/GB)
- **Bandwidth**: R0/month (zero egress fees!)
- **Operations**: Negligible for typical usage

This provides massive cost savings compared to traditional video hosting solutions.

## Troubleshooting

**Video not playing:**
- Check environment variables are set correctly
- Verify R2 bucket permissions
- Ensure custom domain is properly configured

**Upload failures:**
- **Access Denied Error**: Token lacks sufficient permissions
  - Delete current token and create new one with "Admin Read & Write"
  - Or use "Custom" with all object/bucket read/write permissions
  - ListBuckets permission is required for connection testing
- Confirm API token has correct permissions (not just basic Read & Write)
- Check file size limits (R2 supports up to 5TB per object)
- Verify network connectivity to Cloudflare

**Performance issues:**
- Use custom domain for better CDN performance
- Consider video compression before upload
- Monitor R2 analytics for usage patterns

## Security Notes

- R2 API keys provide full bucket access - keep them secure
- Consider implementing server-side upload signing for production
- Monitor usage to prevent unexpected costs from abuse

## Next Steps

1. Set up automated video transcoding (optional)
2. Implement video analytics tracking
3. Add video quality selection (720p, 1080p)
4. Consider HLS streaming for larger files