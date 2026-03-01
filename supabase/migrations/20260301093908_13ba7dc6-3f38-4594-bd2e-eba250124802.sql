
-- Create wardrobe_transfers table
CREATE TABLE public.wardrobe_transfers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  transfer_code text NOT NULL DEFAULT encode(extensions.gen_random_bytes(4), 'hex') UNIQUE,
  redeemed_by uuid,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wardrobe_transfers ENABLE ROW LEVEL SECURITY;

-- Sender can see own transfers
CREATE POLICY "Users can view own transfers"
  ON public.wardrobe_transfers FOR SELECT
  USING (auth.uid() = sender_id);

-- Sender can create transfers
CREATE POLICY "Users can create own transfers"
  ON public.wardrobe_transfers FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Atomic redeem function
CREATE OR REPLACE FUNCTION public.redeem_wardrobe_transfer(p_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer RECORD;
  v_count integer;
BEGIN
  -- Lock the transfer row
  SELECT * INTO v_transfer
  FROM wardrobe_transfers
  WHERE transfer_code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid transfer code';
  END IF;

  IF v_transfer.redeemed_by IS NOT NULL THEN
    RAISE EXCEPTION 'This transfer code has already been redeemed';
  END IF;

  IF v_transfer.sender_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot redeem your own transfer code';
  END IF;

  -- Mark as redeemed
  UPDATE wardrobe_transfers
  SET redeemed_by = auth.uid(), redeemed_at = now()
  WHERE id = v_transfer.id;

  -- Copy all sender's wardrobe items
  INSERT INTO wardrobe_items (user_id, name, category, primary_color, color_hex, style_tags, photo_url, is_new, is_featured)
  SELECT auth.uid(), name, category, primary_color, color_hex, style_tags, photo_url, is_new, is_featured
  FROM wardrobe_items
  WHERE user_id = v_transfer.sender_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
