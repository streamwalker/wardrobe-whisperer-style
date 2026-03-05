
-- ==================== PROFILES ====================
DROP POLICY IF EXISTS "Allow reading profile via active share" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow reading profile via active share" ON public.profiles AS PERMISSIVE FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM wardrobe_shares WHERE wardrobe_shares.user_id = profiles.user_id AND wardrobe_shares.is_active = true));

-- ==================== SAVED_OUTFITS ====================
DROP POLICY IF EXISTS "Users can delete own outfits" ON public.saved_outfits;
DROP POLICY IF EXISTS "Users can insert own outfits" ON public.saved_outfits;
DROP POLICY IF EXISTS "Users can update own outfits" ON public.saved_outfits;
DROP POLICY IF EXISTS "Users can view own outfits" ON public.saved_outfits;

CREATE POLICY "Users can view own outfits" ON public.saved_outfits AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own outfits" ON public.saved_outfits AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own outfits" ON public.saved_outfits AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own outfits" ON public.saved_outfits AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ==================== WARDROBE_ITEMS ====================
DROP POLICY IF EXISTS "Allow reading items via active share" ON public.wardrobe_items;
DROP POLICY IF EXISTS "Users can delete own items" ON public.wardrobe_items;
DROP POLICY IF EXISTS "Users can insert own items" ON public.wardrobe_items;
DROP POLICY IF EXISTS "Users can update own items" ON public.wardrobe_items;
DROP POLICY IF EXISTS "Users can view own items" ON public.wardrobe_items;

CREATE POLICY "Users can view own items" ON public.wardrobe_items AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON public.wardrobe_items AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON public.wardrobe_items AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own items" ON public.wardrobe_items AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow reading items via active share" ON public.wardrobe_items AS PERMISSIVE FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM wardrobe_shares WHERE wardrobe_shares.user_id = wardrobe_items.user_id AND wardrobe_shares.is_active = true));

-- ==================== WARDROBE_SHARES ====================
DROP POLICY IF EXISTS "Anyone can view active shares by token" ON public.wardrobe_shares;
DROP POLICY IF EXISTS "Users can manage own shares" ON public.wardrobe_shares;

CREATE POLICY "Users can manage own shares" ON public.wardrobe_shares AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view active shares by token" ON public.wardrobe_shares AS PERMISSIVE FOR SELECT TO anon, authenticated USING (is_active = true);

-- ==================== WARDROBE_TRANSFERS ====================
DROP POLICY IF EXISTS "Users can create own transfers" ON public.wardrobe_transfers;
DROP POLICY IF EXISTS "Users can view own transfers" ON public.wardrobe_transfers;

CREATE POLICY "Users can view own transfers" ON public.wardrobe_transfers AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = sender_id);
CREATE POLICY "Users can create own transfers" ON public.wardrobe_transfers AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
