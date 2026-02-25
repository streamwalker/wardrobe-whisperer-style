ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS height text,
  ADD COLUMN IF NOT EXISTS weight text,
  ADD COLUMN IF NOT EXISTS shoulder text,
  ADD COLUMN IF NOT EXISTS waist text,
  ADD COLUMN IF NOT EXISTS thigh text,
  ADD COLUMN IF NOT EXISTS inseam text,
  ADD COLUMN IF NOT EXISTS suit_size text,
  ADD COLUMN IF NOT EXISTS shoe_size text;