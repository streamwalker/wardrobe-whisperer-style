-- Trigger function: prune deleted wardrobe item id from all saved_outfits.item_ids arrays.
CREATE OR REPLACE FUNCTION public.prune_deleted_item_from_outfits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.saved_outfits
  SET item_ids = array_remove(item_ids, OLD.id::text)
  WHERE OLD.id::text = ANY(item_ids);
  RETURN OLD;
END;
$$;

-- Trigger: fire after each wardrobe_items delete.
DROP TRIGGER IF EXISTS prune_deleted_item_from_outfits ON public.wardrobe_items;
CREATE TRIGGER prune_deleted_item_from_outfits
AFTER DELETE ON public.wardrobe_items
FOR EACH ROW
EXECUTE FUNCTION public.prune_deleted_item_from_outfits();

-- One-time backfill: remove dangling ids from existing saved_outfits rows.
UPDATE public.saved_outfits so
SET item_ids = COALESCE(
  (
    SELECT array_agg(id ORDER BY ord)
    FROM unnest(so.item_ids) WITH ORDINALITY AS t(id, ord)
    WHERE id IN (SELECT wi.id::text FROM public.wardrobe_items wi)
  ),
  '{}'::text[]
)
WHERE EXISTS (
  SELECT 1
  FROM unnest(so.item_ids) AS t(id)
  WHERE id NOT IN (SELECT wi.id::text FROM public.wardrobe_items wi)
);