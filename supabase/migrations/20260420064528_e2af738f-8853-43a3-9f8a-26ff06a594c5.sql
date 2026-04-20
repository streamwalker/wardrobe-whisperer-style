
-- 1. Create token-gated SECURITY DEFINER RPCs for shared wardrobe access
CREATE OR REPLACE FUNCTION public.get_shared_profile(p_token text)
RETURNS TABLE(display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.display_name
  FROM public.profiles p
  JOIN public.wardrobe_shares s ON s.user_id = p.user_id
  WHERE s.share_token = p_token
    AND s.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_shared_wardrobe(p_token text)
RETURNS TABLE(
  id uuid,
  name text,
  category text,
  primary_color text,
  color_hex text,
  style_tags text[],
  is_new boolean,
  is_featured boolean,
  photo_url text,
  subcategory text,
  description text,
  pattern text,
  texture text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.id, w.name, w.category, w.primary_color, w.color_hex, w.style_tags,
         w.is_new, w.is_featured, w.photo_url, w.subcategory, w.description,
         w.pattern, w.texture
  FROM public.wardrobe_items w
  JOIN public.wardrobe_shares s ON s.user_id = w.user_id
  WHERE s.share_token = p_token
    AND s.is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_profile(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_wardrobe(text) TO anon, authenticated;

-- 2. Drop overly broad RLS policies that don't verify tokens
DROP POLICY IF EXISTS "Allow reading profile via active share" ON public.profiles;
DROP POLICY IF EXISTS "Allow reading items via active share" ON public.wardrobe_items;
DROP POLICY IF EXISTS "Anyone can view active shares by token" ON public.wardrobe_shares;

-- 3. Wardrobe transfers: allow redeemer to view and update their redemption
CREATE POLICY "Redeemer can view own redemption"
ON public.wardrobe_transfers
FOR SELECT
TO authenticated
USING (auth.uid() = redeemed_by);

CREATE POLICY "Redeemer can update own redemption"
ON public.wardrobe_transfers
FOR UPDATE
TO authenticated
USING (auth.uid() = redeemed_by)
WITH CHECK (auth.uid() = redeemed_by);

-- 4. Tighten storage policies on wardrobe-photos
DROP POLICY IF EXISTS "Public read access for wardrobe photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload wardrobe photos" ON storage.objects;

CREATE POLICY "Wardrobe photos: owner or via active share"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'wardrobe-photos'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.wardrobe_shares ws
      WHERE ws.user_id::text = (storage.foldername(name))[1]
        AND ws.is_active = true
    )
  )
);
