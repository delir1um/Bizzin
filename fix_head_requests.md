# Fix HEAD Request Errors - Manual Database Solution

## The Issue
HEAD requests to `user_plans` table are causing 400 Bad Request errors because the table doesn't exist in the Supabase database.

## Solution: Create Missing Table

Since programmatic table creation has limitations, you need to manually create the `user_plans` table in your Supabase dashboard:

### 1. Go to Supabase Dashboard
1. Open your Supabase project: https://giahpkiwivxpocikndix.supabase.co
2. Navigate to the "SQL Editor" tab
3. Create a new query

### 2. Execute This SQL
```sql
-- Create the user_plans table
CREATE TABLE IF NOT EXISTS public.user_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  amount_paid numeric(10,2) DEFAULT 0,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own plans" ON public.user_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans" ON public.user_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans" ON public.user_plans
  FOR UPDATE USING (auth.uid() = user_id);
```

### 3. After Creating the Table
Once the table exists, I can re-enable the disabled plan functionality in the application.

## Alternative: Console-Based Creation
If SQL Editor doesn't work, you can also create the table through the Supabase Table Editor:
1. Go to "Table Editor" 
2. Click "New Table"
3. Name: `user_plans`
4. Add the columns as specified above
5. Enable RLS and add the policies

This will eliminate the 400 HEAD request errors completely.