ALTER TABLE public.saved_outfits
  ALTER COLUMN item_ids SET DATA TYPE text[]
  USING item_ids::text[],
  ALTER COLUMN item_ids SET DEFAULT '{}'::text[];