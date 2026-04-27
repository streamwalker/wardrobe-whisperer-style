-- style_signals: every interaction with a suggested outfit
CREATE TABLE public.style_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('favorite', 'save', 'dismiss', 'view')),
  weight SMALLINT NOT NULL,
  item_ids TEXT[] NOT NULL DEFAULT '{}',
  mood TEXT,
  color_hexes TEXT[] NOT NULL DEFAULT '{}',
  style_tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_style_signals_user_created
  ON public.style_signals (user_id, created_at DESC);

CREATE INDEX idx_style_signals_user_type
  ON public.style_signals (user_id, signal_type);

ALTER TABLE public.style_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own style signals"
  ON public.style_signals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own style signals"
  ON public.style_signals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own style signals"
  ON public.style_signals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- dismissed_outfits: dedupe key (sorted item ids) to suppress re-showing dismissed outfits
CREATE TABLE public.dismissed_outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  outfit_signature TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, outfit_signature)
);

CREATE INDEX idx_dismissed_outfits_user
  ON public.dismissed_outfits (user_id, created_at DESC);

ALTER TABLE public.dismissed_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dismissed outfits"
  ON public.dismissed_outfits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dismissed outfits"
  ON public.dismissed_outfits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dismissed outfits"
  ON public.dismissed_outfits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);