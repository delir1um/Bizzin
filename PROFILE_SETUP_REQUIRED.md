# Profile Pictures Setup Required

To enable profile picture uploads, you need to set up Supabase Storage in your Supabase dashboard:

## 1. Create Storage Bucket

Go to your Supabase Dashboard > Storage and create a new bucket:

```sql
-- Create the profiles bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true);
```

## 2. Set Up Storage Policies

Execute these SQL commands in your Supabase SQL Editor:

```sql
-- Enable RLS on the profiles bucket
UPDATE storage.buckets SET public = true WHERE id = 'profiles';

-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'profiles' 
  AND name LIKE 'avatars/' || auth.uid()::text || '%'
);

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'profiles' 
  AND name LIKE 'avatars/' || auth.uid()::text || '%'
);

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'profiles' 
  AND name LIKE 'avatars/' || auth.uid()::text || '%'
);

-- Allow everyone to view profile pictures (public access)
CREATE POLICY "Anyone can view profile pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');
```

## 3. Alternative: Manual Setup via Dashboard

Instead of SQL, you can also:

1. Go to Storage > Create new bucket
2. Name it "profiles" 
3. Make it public
4. Set up RLS policies through the UI

## Features Enabled

✅ Profile picture upload (max 2MB)
✅ Image validation (only image files)
✅ Hover-to-change interface
✅ Remove profile picture option
✅ Automatic avatar display in navigation
✅ Fallback to user initials if no picture

## Bio Usage Opportunities

The bio field can be used throughout the app for:

- **Enhanced personalization**: Incorporate business focus into welcome messages
- **Goal context**: Show user's business background when displaying achievements
- **Community features**: User profiles for networking (future feature)
- **Onboarding**: Tailor content based on business type mentioned in bio
- **Report generation**: Include user context in business reports
- **Motivational content**: Customize inspirational quotes based on business goals