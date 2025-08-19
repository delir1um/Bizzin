# How to Get Your Supabase Service Role Key

## Step-by-Step Instructions

1. **Go to Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Sign in to your account

2. **Select Your Project**
   - Click on your Bizzin project from the dashboard

3. **Navigate to API Settings**
   - In the left sidebar, click **Settings**
   - Then click **API**

4. **Find the Service Role Key**
   - Look for a section called "Project API keys"
   - You'll see several keys:
     - `anon` key (public key)
     - `service_role` key ← **This is what we need**

5. **Copy the Service Role Key**
   - Click the "Copy" button next to the `service_role` key
   - It will look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long)

## Why We Need This Key

The service role key allows the email system to:
- ✅ Access user data across all users (for personalized content)
- ✅ Read goals, journal entries, and user profiles
- ✅ Create email content records
- ✅ Track email analytics
- ✅ Perform server-side operations

The regular `anon` key has Row Level Security restrictions that prevent these operations.

## Security Note

⚠️ **Important**: The service role key bypasses Row Level Security, so it should:
- Only be used on the server-side (never in frontend code)
- Be kept secure as an environment variable
- Never be committed to version control

## Current Configuration Needed

Add these to your environment variables:

```bash
# SMTP2GO Email Configuration
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=2525
SMTP_USER=bizzin
SMTP_PASSWORD=z6vPRSmGJLraJU9P

# Supabase Configuration  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application URL
BASE_URL=http://localhost:5000
```

## Test the Configuration

Once you have the service role key, the daily email system will be able to:
1. Generate personalized content for each user
2. Send emails through SMTP2GO
3. Track engagement and analytics
4. Process scheduled daily emails

The system is already configured to work with SMTP2GO - just need the service role key!