# Admin Dashboard Setup Instructions

## Quick Setup (3 Steps)

### Step 1: Run Minimal Admin Setup
1. Open your Supabase SQL Editor
2. Copy and paste the contents of `MINIMAL_ADMIN_SETUP.sql`
3. **IMPORTANT**: Replace `your-email@example.com` with your actual email address
4. Execute the SQL

### Step 2: Access Admin Dashboard
1. Log into your Bizzin app with the email you used in Step 1
2. Navigate to `/admin` in your browser
3. You should now see the full admin dashboard

### Step 3: Verify Access
The admin dashboard includes:
- **User Management**: View and manage all platform users
- **Early Signups**: Manage pre-launch leads (if early_signups table exists)
- **Content Management**: Manage podcast episodes and content
- **Financial Overview**: Revenue tracking and subscription analytics
- **System Health**: Database status and performance monitoring
- **Analytics Dashboard**: Interactive charts and KPIs

## Troubleshooting

### Error: "policy already exists"
- This is normal if you've run setup before
- The admin dashboard will work with existing policies
- Just make sure your email is added to admin_users table

### Error: "table does not exist"
- The admin dashboard is designed to work with whatever tables exist
- Missing tables will show "No data available" instead of errors
- All core functionality works with just the admin_users table

### Can't access /admin page
1. Verify you're logged in with the correct email
2. Check that your email was added to admin_users table:
   ```sql
   SELECT * FROM admin_users WHERE email = 'your-email@example.com';
   ```
3. If no results, run the INSERT statement from the setup file again

## Features Available

### Real-time Updates
- Dashboard automatically updates when data changes
- Uses Supabase realtime subscriptions for instant synchronization

### Export Capabilities
- Export user data to CSV
- Export early signups data
- Export financial reports

### Bulk Operations
- Mass email notifications
- Bulk user management
- Content publishing controls

## Next Steps
Once admin access is working, you can:
1. Manage existing users and their data
2. Set up additional database tables as needed
3. Configure content management for podcasts
4. Monitor system health and analytics