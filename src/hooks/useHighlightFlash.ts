import { useCallback, useRef, useState } from "react";

/**
 * Transiently flags an item id as "highlighted" for a fixed duration. Used to
 * briefly visually confirm an action (e.g., an item just moved category via
 * drag-and-drop, or was updated via the edit dialog).
 *
 * A ref tracks the pending timeout so rapid re-triggers reset the timer
 * instead of stacking clears.
 */
export function useHighlightFlash(durationMs = 2000) {
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback(
    (id: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setHighlightId(id);
      timeoutRef.current = setTimeout(() => {
        setHighlightId(null);
        timeoutRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  return { highlightId, flash };
}
