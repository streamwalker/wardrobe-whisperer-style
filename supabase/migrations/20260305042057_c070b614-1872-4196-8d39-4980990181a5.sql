
-- Fix: restrict non-share policies to authenticated only (drop and recreate)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own outfits" ON public.saved_outfits;
DROP POLICY IF EXISTS "Users can insert own outfits" ON public.saved_outfits;
DROP POLICY IF EXISTS "Users can update own outfits" ON public.saved_outfits;
DROP POLICY IF EXISTS "Users can delete own outfits" ON public.saved_outfits;

CREATE POLICY "Users can view own outfits" ON public.saved_outfits AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own outfits" ON public.saved_outfits AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own outfits" ON public.saved_outfits AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own outfits" ON public.saved_outfits AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own items" ON public.wardrobe_items;
DROP POLICY IF EXISTS "Users can insert own items" ON public.wardrobe_items;
DROP POLICY IF EXISTS "Users can update own items" ON public.wardrobe_items;
DROP POLICY IF EXISTS "Users can delete own items" ON public.wardrobe_items;

CREATE POLICY "Users can view own items" ON public.wardrobe_items AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON public.wardrobe_items AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON public.wardrobe_items AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own items" ON public.wardrobe_items AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own shares" ON public.wardrobe_shares;
CREATE POLICY "Users can manage own shares" ON public.wardrobe_shares AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own transfers" ON public.wardrobe_transfers;
DROP POLICY IF EXISTS "Users can create own transfers" ON public.wardrobe_transfers;

CREATE POLICY "Users can view own transfers" ON public.wardrobe_transfers AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = sender_id);
CREATE POLICY "Users can create own transfers" ON public.wardrobe_transfers AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
