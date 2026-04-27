import type { WardrobeItem } from "@/lib/wardrobe-data";
import { describeOutfitPalette } from "@/lib/color-theory";
import { formalityCompatibility } from "@/lib/style-rules";

export interface ScannedItem {
  name?: string;
  category?: string;
  primary_color?: string;
  color_hex: string;
  style_tags?: string[];
  pattern?: string;
  texture?: string;
  description?: string;
  subcategory?: string;
}

export interface ScoredMatch {
  item: WardrobeItem;
  score: number; // 0..100
  breakdown: {
    color: number;
    style: number;
    formality: number;
    patternTexture: number;
  };
  relationshipLabel: string; // e.g. "COMPLEMENTARY"
}

export interface CatalogMatchResult {
  shoes: ScoredMatch[];
  pants: ScoredMatch[];
  shirts: ScoredMatch[];
}

const MIN_SCORE = 35;
const TOP_N = 3;

function colorScore(scannedHex: string, candidateHex: string): { pts: number; label: string } {
  const palette = describeOutfitPalette([scannedHex, candidateHex]);
  let pts: number;
  switch (palette.relationship) {
    case "complementary":
    case "analogous":
    case "neutral-anchor":
    case "monochrome":
      pts = 50;
      break;
    case "triadic":
      pts = 40;
      break;
    case "tonal-contrast":
      pts = 35;
      break;
    default:
      pts = 20;
  }
  return { pts, label: palette.label };
}

function styleTagScore(a: string[] = [], b: string[] = []): number {
  if (a.length === 0 && b.length === 0) return 12; // mild neutral credit
  const setA = new Set(a.map((t) => t.toLowerCase()));
  const setB = new Set(b.map((t) => t.toLowerCase()));
  const intersection = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  if (union === 0) return 0;
  return Math.round((25 * intersection) / union);
}

function formalityScore(scanned: ScannedItem, candidate: WardrobeItem): number {
  const compat = formalityCompatibility(scanned, candidate);
  // -1..+1 → 0..15 with neutral midpoint ~10
  if (compat === 1) return 15;
  if (compat === -1) return -10; // hard penalty so mismatches drop below MIN_SCORE
  return 10;
}

function patternTextureScore(scanned: ScannedItem, candidate: WardrobeItem): number {
  let pts = 0;
  const scannedPatterned = scanned.pattern && scanned.pattern !== "solid";
  const candPatterned = candidate.pattern && candidate.pattern !== "solid";
  // Both solid OR exactly one patterned → safe
  if (!scannedPatterned && !candPatterned) pts += 4;
  else if (scannedPatterned !== candPatterned) pts += 6;
  else pts -= 4; // both patterned — risk

  // Texture contrast — small bonus when textures differ
  if (scanned.texture && candidate.texture && scanned.texture !== candidate.texture) {
    pts += 4;
  } else if (scanned.texture && candidate.texture) {
    pts += 1;
  }

  return Math.max(-4, Math.min(10, pts));
}

function scoreOne(scanned: ScannedItem, candidate: WardrobeItem): ScoredMatch {
  const { pts: color, label } = colorScore(scanned.color_hex, candidate.color_hex);
  const style = styleTagScore(scanned.style_tags, candidate.style_tags as string[]);
  const formality = formalityScore(scanned, candidate);
  const patternTexture = patternTextureScore(scanned, candidate);
  const total = Math.max(0, Math.min(100, color + style + formality + patternTexture));
  return {
    item: candidate,
    score: total,
    breakdown: { color, style, formality, patternTexture },
    relationshipLabel: label,
  };
}

function topMatchesIn(
  scanned: ScannedItem,
  catalog: WardrobeItem[],
  categories: string[],
): ScoredMatch[] {
  return catalog
    .filter((it) => categories.includes(it.category))
    .map((it) => scoreOne(scanned, it))
    .filter((s) => s.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_N);
}

/**
 * Returns the top matches from the user's wardrobe in each of the
 * three target buckets — shoes, pants, shirts — for a freshly
 * scanned shopping item.
 */
export function scoreCatalogMatches(
  scanned: ScannedItem,
  catalog: WardrobeItem[],
): CatalogMatchResult {
  return {
    shoes: topMatchesIn(scanned, catalog, ["shoes", "dress-shoes"]),
    pants: topMatchesIn(scanned, catalog, ["pants"]),
    shirts: topMatchesIn(scanned, catalog, ["tops"]),
  };
}
