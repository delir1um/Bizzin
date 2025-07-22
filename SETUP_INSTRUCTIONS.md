# Bizzin Goals Feature Setup Instructions

## Database Setup Required

The Goals feature requires a Supabase database table. Please follow these steps:

### 1. Create the Goals Table

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `database-setup-simple.sql` file in the project root
4. This will create the `goals` table with proper Row Level Security policies

**Important**: Use `database-setup-simple.sql` instead of `database-setup.sql` to avoid foreign key constraint issues.

### 2. Key Database Fields

The goals table includes:
- `id` (UUID, primary key)
- `title` (text, required)
- `description` (text, optional)
- `status` (enum: not_started, in_progress, completed, on_hold, at_risk)
- `progress` (integer, 0-100)
- `target_value` (integer, optional)
- `current_value` (integer, optional) 
- `deadline` (timestamp)
- `user_id` (UUID, references auth.users)
- `priority` (enum: low, medium, high)
- `category` (text, optional)

### 3. Authentication Setup

⚠️ **Important**: 
- Make sure you have signed up through the Supabase authentication system (via the /auth page)
- The user ID from Supabase auth must match the user_id used in the goals table
- If you get foreign key constraint errors, use the `database-setup-simple.sql` script instead

### 4. Current Status

⚠️ **Important**: The category field is temporarily disabled in the UI because it may not exist in your current database. After running the SQL setup script, you can re-enable the category field in the forms.

### 5. Features Available

✅ Create new goals
✅ Edit existing goals  
✅ View goal statistics
✅ Filter goals by status
✅ Progress tracking
✅ Priority levels
✅ Authentication & user isolation

### 6. Next Steps

After setting up the database:
1. Test creating a goal
2. Test editing a goal
3. Verify all data is saving correctly
4. Check that Row Level Security is working (users can only see their own goals)

## Need Help?

If you encounter any issues:
1. Verify your Supabase environment variables are set
2. Check that the SQL script ran without errors
3. Ensure your Supabase project has the auth schema enabled
4. Verify Row Level Security policies are active