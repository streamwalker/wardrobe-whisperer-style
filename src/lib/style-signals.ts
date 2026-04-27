/**
 * Lightweight signal logger. Records user interactions with suggested
 * outfits so the preference profile can learn what to boost / suppress.
 *
 * All calls are fire-and-forget: failures only console.warn — they
 * NEVER toast or block the UI.
 */

import { supabase } from "@/integrations/supabase/client";
import type { WardrobeItem } from "@/lib/wardrobe-data";

export type SignalType = "favorite" | "save" | "dismiss" | "view";

export const SIGNAL_WEIGHTS: Record<SignalType, number> = {
  favorite: 2,
  save: 1,
  view: 1,
  dismiss: -2,
};

export interface SignalSnapshot {
  itemIds?: string[];
  mood?: string | null;
  colorHexes?: string[];
  styleTags?: string[];
}

/** Stable key for an outfit (sorted item ids joined). */
export function signatureFor(itemIds: string[]): string {
  return [...itemIds].sort().join("|");
}

/** Build a snapshot from a list of WardrobeItems. */
export function snapshotFromItems(
  items: WardrobeItem[],
  mood?: string | null,
): SignalSnapshot {
  const colorHexes = Array.from(
    new Set(items.map((i) => i.color_hex).filter(Boolean)),
  );
  const styleTags = Array.from(
    new Set(items.flatMap((i) => i.style_tags || [])).values(),
  ) as string[];
  return {
    itemIds: items.map((i) => i.id).filter(Boolean),
    mood: mood ?? undefined,
    colorHexes,
    styleTags,
  };
}

/**
 * Insert a signal row. Best-effort; never throws.
 * Pass `userId` if you already have it to skip an extra fetch.
 */
export async function recordSignal(
  type: SignalType,
  snapshot: SignalSnapshot,
  userId?: string,
): Promise<void> {
  try {
    let uid = userId;
    if (!uid) {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id;
    }
    if (!uid) return;

    await supabase.from("style_signals").insert({
      user_id: uid,
      signal_type: type,
      weight: SIGNAL_WEIGHTS[type],
      item_ids: snapshot.itemIds ?? [],
      mood: snapshot.mood ?? null,
      color_hexes: snapshot.colorHexes ?? [],
      style_tags: snapshot.styleTags ?? [],
    });
  } catch (err) {
    console.warn("[style-signals] recordSignal failed:", err);
  }
}

/**
 * Insert a row into dismissed_outfits to suppress a specific suggestion
 * from being re-shown. ON CONFLICT DO NOTHING via UNIQUE constraint.
 */
export async function recordDismissedOutfit(
  itemIds: string[],
  userId?: string,
): Promise<void> {
  try {
    let uid = userId;
    if (!uid) {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id;
    }
    if (!uid) return;

    await supabase
      .from("dismissed_outfits")
      .insert({
        user_id: uid,
        outfit_signature: signatureFor(itemIds),
      });
    // Conflicts are fine — the row is already there.
  } catch (err) {
    // Unique-violation is expected and harmless; only log other errors.
    if (!String(err).includes("duplicate key")) {
      console.warn("[style-signals] recordDismissedOutfit failed:", err);
    }
  }
}

/**
 * View signals are the chattiest. Debounce to one per item per minute
 * within the current tab to avoid hammering the DB.
 */
const recentViews = new Map<string, number>();
const VIEW_DEBOUNCE_MS = 60_000;

export function recordItemView(item: WardrobeItem, userId?: string): void {
  const key = item.id;
  const now = Date.now();
  const last = recentViews.get(key);
  if (last && now - last < VIEW_DEBOUNCE_MS) return;
  recentViews.set(key, now);

  void recordSignal(
    "view",
    {
      itemIds: [item.id],
      colorHexes: item.color_hex ? [item.color_hex] : [],
      styleTags: item.style_tags as string[] | undefined,
    },
    userId,
  );
}
