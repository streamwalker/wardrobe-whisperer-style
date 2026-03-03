ALTER TABLE public.wardrobe_items DROP CONSTRAINT wardrobe_items_category_check;
ALTER TABLE public.wardrobe_items ADD CONSTRAINT wardrobe_items_category_check 
  CHECK (category = ANY (ARRAY['shoes','pants','tops','outerwear','suits','accessories','dress-shoes']));