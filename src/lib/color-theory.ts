// Pure color-theory helper. No deps.

export type ColorRelationship =
  | "monochrome"
  | "analogous"
  | "complementary"
  | "triadic"
  | "neutral-anchor"
  | "tonal-contrast";

export interface PaletteAnalysis {
  relationship: ColorRelationship;
  label: string;
  rationale: string;
  dominantHexes: string[];
}

interface HSL {
  h: number; // 0..360
  s: number; // 0..100
  l: number; // 0..100
}

function hexToHsl(hex: string): HSL | null {
  const m = /^#?([a-f\d]{6})$/i.exec(hex || "");
  if (!m) return null;
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
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function isNeutral(c: HSL): boolean {
  return c.s < 12 || c.l < 12 || c.l > 88;
}

function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function dedupeHex(hexes: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const h of hexes) {
    const k = (h || "").toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(h);
  }
  return out;
}

const RATIONALES: Record<ColorRelationship, string> = {
  monochrome:
    "Single hue worked at different depths — quietly cohesive, never busy.",
  analogous:
    "Neighboring hues on the color wheel — they blend smoothly without competing.",
  complementary:
    "Opposite hues on the wheel — they make each other pop without clashing.",
  triadic:
    "Three hues evenly spaced on the wheel — vibrant balance with built-in contrast.",
  "neutral-anchor":
    "Neutrals ground the palette so the accent color stays the focal point.",
  "tonal-contrast":
    "Same hue, different tones — depth and dimension without adding new colors.",
};

const LABELS: Record<ColorRelationship, string> = {
  monochrome: "MONOCHROME",
  analogous: "ANALOGOUS",
  complementary: "COMPLEMENTARY",
  triadic: "TRIADIC",
  "neutral-anchor": "NEUTRAL ANCHOR",
  "tonal-contrast": "TONAL CONTRAST",
};

export function describeOutfitPalette(hexes: string[]): PaletteAnalysis {
  const dominantHexes = dedupeHex(hexes.filter(Boolean));
  const parsed = dominantHexes
    .map((h) => ({ hex: h, hsl: hexToHsl(h) }))
    .filter((p): p is { hex: string; hsl: HSL } => !!p.hsl);

  const neutrals = parsed.filter((p) => isNeutral(p.hsl));
  const chromatics = parsed.filter((p) => !isNeutral(p.hsl));

  const make = (rel: ColorRelationship): PaletteAnalysis => ({
    relationship: rel,
    label: LABELS[rel],
    rationale: RATIONALES[rel],
    dominantHexes,
  });

  // Default fallback
  if (parsed.length === 0) return make("neutral-anchor");

  // All neutral
  if (chromatics.length === 0) {
    // Variation in lightness => tonal contrast, else monochrome
    const ls = neutrals.map((n) => n.hsl.l);
    const spread = Math.max(...ls) - Math.min(...ls);
    return make(spread > 25 ? "tonal-contrast" : "monochrome");
  }

  // Neutrals + at least one accent
  if (neutrals.length >= 1 && chromatics.length >= 1 && chromatics.length <= 2) {
    return make("neutral-anchor");
  }

  // Two or more chromatic colors — analyze hues
  const hues = chromatics.map((c) => c.hsl.h);

  if (chromatics.length === 1) {
    const ls = parsed.map((p) => p.hsl.l);
    const spread = Math.max(...ls) - Math.min(...ls);
    return make(spread > 30 ? "tonal-contrast" : "monochrome");
  }

  // Pairwise distances
  const maxHueSpread = (() => {
    let m = 0;
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        m = Math.max(m, hueDist(hues[i], hues[j]));
      }
    }
    return m;
  })();

  // Triadic: three chromatic clusters roughly 120° apart
  if (chromatics.length >= 3) {
    const sorted = [...hues].sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 0; i < sorted.length - 1; i++) gaps.push(sorted[i + 1] - sorted[i]);
    gaps.push(360 - sorted[sorted.length - 1] + sorted[0]);
    const inTriadicRange = gaps.filter((g) => g >= 90 && g <= 150).length;
    if (inTriadicRange >= 2) return make("triadic");
  }

  // Complementary: largest spread near 180°
  if (maxHueSpread >= 150) return make("complementary");

  // Analogous: all hues within 40°
  if (maxHueSpread <= 40) {
    // If lightness varies a lot, call it tonal contrast
    const ls = chromatics.map((c) => c.hsl.l);
    const spread = Math.max(...ls) - Math.min(...ls);
    if (maxHueSpread <= 15 && spread > 30) return make("tonal-contrast");
    if (maxHueSpread <= 15) return make("monochrome");
    return make("analogous");
  }

  // Mid-range (40°–150°): treat as analogous-leaning if ≤90°, otherwise neutral anchor fallback
  if (maxHueSpread <= 90) return make("analogous");

  return make("neutral-anchor");
}
