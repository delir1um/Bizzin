# Pre-Launch Mode Toggle Instructions

## Overview
The Bizzin platform now supports a **Pre-Launch Mode** that displays a marketing landing page for lead capture while preserving all development work.

## How to Toggle Between Modes

### Option 1: Environment Variable (Recommended)
1. Create a `.env` file in the root directory (if it doesn't exist)
2. Add this line to enable pre-launch mode:
   ```
   VITE_PRE_LAUNCH_MODE=true
   ```
3. Set to `false` or remove the line to return to development mode
4. Restart the development server after changing

### Option 2: Direct Code Toggle (Quick Testing)
In `client/src/App.tsx`, find this line:
```typescript
const isPreLaunchMode = import.meta.env.VITE_PRE_LAUNCH_MODE === 'true'
```

You can temporarily change it to:
```typescript
const isPreLaunchMode = true  // Force pre-launch mode
const isPreLaunchMode = false // Force development mode
```

## Mode Differences

### Pre-Launch Mode (`VITE_PRE_LAUNCH_MODE=true`)
- **Public users**: See only the marketing landing page with lead capture form
- **Authenticated users**: Full access to the complete platform (dashboard, journal, goals, etc.)
- **Routes**: Minimal routing - only essential pages for authenticated users
- **Layout**: No navigation layout for public users
- **Purpose**: Lead generation and marketing awareness

### Development Mode (`VITE_PRE_LAUNCH_MODE=false` or not set)
- **Public users**: See full marketing preview pages (HomePage, Journal preview, Goals preview, etc.)
- **Authenticated users**: Full access to the complete platform
- **Routes**: Complete routing with all preview and protected pages
- **Layout**: Full navigation layout for all users
- **Purpose**: Development and testing of the complete platform

## Database Setup
Before enabling pre-launch mode:
1. Run the SQL commands in `EARLY_SIGNUPS_TABLE_SETUP.sql` in your Supabase SQL editor
2. This creates the table to store early signup leads

## Lead Management
Early signups are stored in the `early_signups` table with:
- Contact information (email, name, business details)
- Business type and size for segmentation
- Signup timestamp and source tracking
- Notification status for follow-up campaigns

## Best Practices
1. **Development**: Keep in development mode while building features
2. **Testing**: Toggle to pre-launch mode to test the marketing flow
3. **Production**: Enable pre-launch mode for public marketing campaigns
4. **Monitoring**: Check the `early_signups` table regularly for new leads

## Contact Information
The pre-launch page includes `hello@bizzin.co.za` as the contact email - update this in `PreLaunchPage.tsx` if needed.