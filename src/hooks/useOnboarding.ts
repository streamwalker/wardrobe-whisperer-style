import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type TourKey = "wardrobe" | "outfits";

const COLUMN_BY_KEY: Record<TourKey, "onboarding_completed_at" | "outfits_tour_completed_at"> = {
  wardrobe: "onboarding_completed_at",
  outfits: "outfits_tour_completed_at",
};

export function useOnboarding(opts: {
  userId: string | undefined;
  ready: boolean;
  shouldAutoStart: boolean;
  tourKey?: TourKey;
}) {
  const tourKey: TourKey = opts.tourKey ?? "wardrobe";
  const column = COLUMN_BY_KEY[tourKey];
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!opts.ready || !opts.shouldAutoStart || !opts.userId) return;
    let cancelled = false;
    let timeoutId: number | undefined;

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(column)
        .eq("user_id", opts.userId!)
        .maybeSingle();

      if (cancelled) return;
      if (error) return;

      if (!(data as Record<string, unknown> | null)?.[column]) {
        // tiny delay so target elements are mounted
        timeoutId = window.setTimeout(() => {
          if (!cancelled) setIsOpen(true);
        }, 300);
      }
    })();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [opts.ready, opts.shouldAutoStart, opts.userId, column]);

  const finish = useCallback(async () => {
    setIsOpen(false);
    if (!opts.userId) return;
    await supabase
      .from("profiles")
      .update({ [column]: new Date().toISOString() })
      .eq("user_id", opts.userId);
  }, [opts.userId, column]);

  const start = useCallback(() => setIsOpen(true), []);

  return { isOpen, start, finish };
}

export async function restartOnboarding(userId: string) {
  // Clear both tour completion flags so the user re-experiences every guided tour.
  await supabase
    .from("profiles")
    .update({
      onboarding_completed_at: null,
      outfits_tour_completed_at: null,
    })
    .eq("user_id", userId);
}
