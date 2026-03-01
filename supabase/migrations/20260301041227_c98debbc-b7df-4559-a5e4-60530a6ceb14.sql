
DROP POLICY IF EXISTS "Authenticated users can upload own photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload own photos" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wardrobe-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
