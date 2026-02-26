
CREATE POLICY "Allow reading items via active share"
  ON public.wardrobe_items FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wardrobe_shares
      WHERE wardrobe_shares.user_id = wardrobe_items.user_id
        AND wardrobe_shares.is_active = true
    )
  );

CREATE POLICY "Allow reading profile via active share"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wardrobe_shares
      WHERE wardrobe_shares.user_id = profiles.user_id
        AND wardrobe_shares.is_active = true
    )
  );
