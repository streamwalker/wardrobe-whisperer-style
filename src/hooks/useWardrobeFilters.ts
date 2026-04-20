import { useCallback, useMemo, useState } from "react";
import { getColorTone, type ColorTone, type StyleTag, type WardrobeItem } from "@/lib/wardrobe-data";

/**
 * Wardrobe filter state: four independent dimensions (tone, style, pattern,
 * texture), each a Set of active values. `applyFilters` composes all four
 * as an AND-join. Toggling the same value twice removes it.
 */
export function useWardrobeFilters() {
  const [activeTones, setActiveTones] = useState<Set<ColorTone>>(new Set());
  const [activeStyles, setActiveStyles] = useState<Set<StyleTag>>(new Set());
  const [activePatterns, setActivePatterns] = useState<Set<string>>(new Set());
  const [activeTextures, setActiveTextures] = useState<Set<string>>(new Set());

  const toggleTone = useCallback((tone: ColorTone) => {
    setActiveTones((prev) => {
      const next = new Set(prev);
      next.has(tone) ? next.delete(tone) : next.add(tone);
      return next;
    });
  }, []);

  const toggleStyle = useCallback((style: StyleTag) => {
    setActiveStyles((prev) => {
      const next = new Set(prev);
      next.has(style) ? next.delete(style) : next.add(style);
      return next;
    });
  }, []);

  const togglePattern = useCallback((p: string) => {
    setActivePatterns((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  }, []);

  const toggleTexture = useCallback((t: string) => {
    setActiveTextures((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveTones(new Set());
    setActiveStyles(new Set());
    setActivePatterns(new Set());
    setActiveTextures(new Set());
  }, []);

  const hasFilters = useMemo(
    () =>
      activeTones.size > 0 ||
      activeStyles.size > 0 ||
      activePatterns.size > 0 ||
      activeTextures.size > 0,
    [activeTones, activeStyles, activePatterns, activeTextures],
  );

  const applyFilters = useCallback(
    (items: WardrobeItem[]) => {
      let result = items;
      if (activeTones.size > 0) {
        result = result.filter((i) => activeTones.has(getColorTone(i.color_hex)));
      }
      if (activeStyles.size > 0) {
        result = result.filter((i) => i.style_tags.some((t) => activeStyles.has(t)));
      }
      if (activePatterns.size > 0) {
        result = result.filter((i) => i.pattern && activePatterns.has(i.pattern));
      }
      if (activeTextures.size > 0) {
        result = result.filter((i) => i.texture && activeTextures.has(i.texture));
      }
      return result;
    },
    [activeTones, activeStyles, activePatterns, activeTextures],
  );

  return {
    activeTones,
    activeStyles,
    activePatterns,
    activeTextures,
    toggleTone,
    toggleStyle,
    togglePattern,
    toggleTexture,
    clearFilters,
    hasFilters,
    applyFilters,
  };
}
