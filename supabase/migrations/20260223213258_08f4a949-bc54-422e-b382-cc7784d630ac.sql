
-- Allow authenticated users to upload files to the wardrobe-photos bucket
CREATE POLICY "Authenticated users can upload wardrobe photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wardrobe-photos');

-- Allow public read access (bucket is already public, but policy needed)
CREATE POLICY "Public read access for wardrobe photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'wardrobe-photos');
