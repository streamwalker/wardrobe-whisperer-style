
CREATE TABLE public.wardrobe_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.wardrobe_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shares"
  ON public.wardrobe_shares FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active shares by token"
  ON public.wardrobe_shares FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
