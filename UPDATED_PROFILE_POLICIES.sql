-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;

-- Create updated policies that work with the current file path structure
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'profiles' 
  AND name LIKE 'avatars/' || auth.uid()::text || '%'
);

CREATE POLICY "Users can update their own profile pictures" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'profiles' 
  AND name LIKE 'avatars/' || auth.uid()::text || '%'
);

CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'profiles' 
  AND name LIKE 'avatars/' || auth.uid()::text || '%'
);

CREATE POLICY "Anyone can view profile pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');