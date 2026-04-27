/**
 * Builds an in-memory preference profile from a user's recent
 * style_signals rows, then exposes scoring helpers used by every
 * suggestion surface.
 *
 * Pure / deterministic — no I/O. The hook owns the fetch + caching.
 */

import type { WardrobeItem } from "@/lib/wardrobe-data";

export interface SignalRow {
  signal_type: "favorite" | "save" | "dismiss" | "view";
  weight: number;
  item_ids: string[];
  mood: string | null;
  color_hexes: string[];
  style_tags: string[];
  created_at: string;
}

export interface PreferenceProfile {
  itemWeights: Map<string, number>;
  tagWeights: Map<string, number>;
  moodWeights: Map<string, number>;
  /** Hue bucket (0..71) → weight. 24 hues × 3 lightness tiers = 72 buckets. */
  colorWeights: Map<number, number>;
  /** Pre-recorded outfit signatures the user explicitly dismissed. */
  dismissedSignatures: Set<string>;
  /** Total weight magnitude — used to decide whether to even apply boosts. */
  totalMagnitude: number;
}

/** Half-life for signal weight decay, in days. */
const HALF_LIFE_DAYS = 30;
const MS_PER_DAY = 86_400_000;

function recencyMultiplier(createdAt: string, now: number): number {
  const age = (now - new Date(createdAt).getTime()) / MS_PER_DAY;
  if (age <= 0) return 1;
  return Math.pow(0.5, age / HALF_LIFE_DAYS);
}

/** Convert hex → HSL bucket index (0..71). Returns -1 if hex is invalid. */
export function hexToBucket(hex: string): number {
  const m = /^#?([a-f\d]{6})$/i.exec(hex || "");
  if (!m) return -1;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  // Treat near-grayscale as a single neutral bucket = 71
  if (s < 0.12) return 71;

  const hueBucket = Math.floor(h / 15) % 24; // 0..23
  const lightTier = l < 0.34 ? 0 : l < 0.67 ? 1 : 2; // 0..2
  return hueBucket + lightTier * 24; // 0..71 (overlaps neutrals at 71 — acceptable)
}

function bumpMap<K>(map: Map<K, number>, key: K, delta: number) {
  map.set(key, (map.get(key) ?? 0) + delta);
}

/** Build a profile from raw signal rows. */
export function buildProfile(rows: SignalRow[]): PreferenceProfile {
  const now = Date.now();
  const itemWeights = new Map<string, number>();
  const tagWeights = new Map<string, number>();
  const moodWeights = new Map<string, number>();
  const colorWeights = new Map<number, number>();
  const dismissedSignatures = new Set<string>();
  let totalMagnitude = 0;

  for (const row of rows) {
    const decay = recencyMultiplier(row.created_at, now);
    const w = row.weight * decay;
    totalMagnitude += Math.abs(w);

    for (const id of row.item_ids ?? []) bumpMap(itemWeights, id, w);
    for (const tag of row.style_tags ?? []) bumpMap(tagWeights, tag.toLowerCase(), w);
    if (row.mood) bumpMap(moodWeights, row.mood.toLowerCase(), w);
    for (const hex of row.color_hexes ?? []) {
      const b = hexToBucket(hex);
      if (b >= 0) bumpMap(colorWeights, b, w);
    }

    if (row.signal_type === "dismiss" && row.item_ids?.length) {
      dismissedSignatures.add([...row.item_ids].sort().join("|"));
    }
  }

  return { itemWeights, tagWeights, moodWeights, colorWeights, dismissedSignatures, totalMagnitude };
}

const EMPTY_PROFILE: PreferenceProfile = {
  itemWeights: new Map(),
  tagWeights: new Map(),
  moodWeights: new Map(),
  colorWeights: new Map(),
  dismissedSignatures: new Set(),
  totalMagnitude: 0,
};

export function emptyProfile(): PreferenceProfile {
  return EMPTY_PROFILE;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Boost score for a single wardrobe item, in the range [-15, +15].
 * Used by the local Shop catalog scorer.
 */
export function scoreItemBoost(profile: PreferenceProfile, item: WardrobeItem): number {
  if (profile.totalMagnitude < 1) return 0; // Not enough data yet

  const itemBoost = profile.itemWeights.get(item.id) ?? 0;
  const colorBoost = (() => {
    const b = hexToBucket(item.color_hex);
    return b >= 0 ? (profile.colorWeights.get(b) ?? 0) : 0;
  })();
  const tagBoost = (item.style_tags || []).reduce(
    (acc, t) => acc + (profile.tagWeights.get(String(t).toLowerCase()) ?? 0),
    0,
  );

  // Normalize against total magnitude so a heavy user doesn't get
  // runaway boosts. Scale so a strong, consistent preference reaches ~15.
  const norm = Math.max(profile.totalMagnitude, 5);
  const raw = (itemBoost * 3 + colorBoost * 1.5 + tagBoost) / norm * 30;
  return clamp(raw, -15, +15);
}

/**
 * Boost score for an outfit (collection of items + optional mood),
 * in the range [-25, +25]. Used by AI drawer rerankers.
 */
export function scoreOutfitBoost(
  profile: PreferenceProfile,
  args: { items: WardrobeItem[]; mood?: string | null },
): number {
  if (profile.totalMagnitude < 1) return 0;

  const itemTotal = args.items.reduce(
    (acc, i) => acc + (profile.itemWeights.get(i.id) ?? 0),
    0,
  );
  const colorTotal = args.items.reduce((acc, i) => {
    const b = hexToBucket(i.color_hex);
    return acc + (b >= 0 ? (profile.colorWeights.get(b) ?? 0) : 0);
  }, 0);
  const tagTotal = args.items.reduce(
    (acc, i) =>
      acc +
      (i.style_tags || []).reduce(
        (s, t) => s + (profile.tagWeights.get(String(t).toLowerCase()) ?? 0),
        0,
      ),
    0,
  );
  const moodBoost = args.mood ? (profile.moodWeights.get(args.mood.toLowerCase()) ?? 0) : 0;

  const norm = Math.max(profile.totalMagnitude, 5);
  const raw = (itemTotal * 2 + colorTotal + tagTotal + moodBoost * 2) / norm * 35;
  return clamp(raw, -25, +25);
}

/**
 * Filter out previously-dismissed outfits and rerank the rest by
 * applying a soft preference nudge on top of the original AI ordering.
 */
export interface RerankableOutfit {
  item_ids: string[];
  mood?: string | null;
}

export function rerankOutfits<T extends RerankableOutfit>(
  outfits: T[],
  profile: PreferenceProfile,
  catalog: WardrobeItem[],
): T[] {
  const itemById = new Map(catalog.map((c) => [c.id, c]));

  const filtered = outfits.filter((o) => {
    const sig = [...o.item_ids].sort().join("|");
    return !profile.dismissedSignatures.has(sig);
  });

  if (profile.totalMagnitude < 1) return filtered;

  // Stable rerank: original index + boost nudge
  return filtered
    .map((o, originalIdx) => {
      const items = o.item_ids
        .map((id) => itemById.get(id))
        .filter((i): i is WardrobeItem => !!i);
      const boost = scoreOutfitBoost(profile, { items, mood: o.mood ?? null });
      // Lower score = better rank. AI order weighted more than learned boost.
      const composite = originalIdx * 10 - boost * 0.5;
      return { o, composite };
    })
    .sort((a, b) => a.composite - b.composite)
    .map((x) => x.o);
}

/**
 * For the Profile page transparency card: top N tags + top N color
 * buckets the user's signals are pushing toward.
 */
export function topPositiveTags(profile: PreferenceProfile, n = 5): { tag: string; weight: number }[] {
  return [...profile.tagWeights.entries()]
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tag, weight]) => ({ tag, weight }));
}

export function topPositiveColors(profile: PreferenceProfile, n = 5): { hex: string; weight: number }[] {
  // Convert bucket back to a representative hex for display.
  const out: { bucket: number; weight: number }[] = [...profile.colorWeights.entries()]
    .filter(([, w]) => w > 0)
    .map(([bucket, weight]) => ({ bucket, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, n);

  return out.map(({ bucket, weight }) => ({ hex: bucketToRepresentativeHex(bucket), weight }));
}

function bucketToRepresentativeHex(bucket: number): string {
  if (bucket === 71) return "#888888";
  const hueBucket = bucket % 24;
  const lightTier = Math.floor(bucket / 24);
  const h = hueBucket * 15 + 7.5;
  const s = 0.6;
  const l = lightTier === 0 ? 0.25 : lightTier === 1 ? 0.5 : 0.75;
  return hslToHex(h, s, l);
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
