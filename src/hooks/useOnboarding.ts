import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ds_onboarding_completed";

export function useOnboarding(opts: { ready: boolean; shouldAutoStart: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!opts.ready || !opts.shouldAutoStart) return;
    if (typeof window === "undefined") return;
    const completed = window.localStorage.getItem(STORAGE_KEY) === "true";
    if (!completed) {
      // tiny delay so target elements are mounted
      const t = window.setTimeout(() => setIsOpen(true), 300);
      return () => window.clearTimeout(t);
    }
  }, [opts.ready, opts.shouldAutoStart]);

  const finish = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
    setIsOpen(false);
  }, []);

  const start = useCallback(() => setIsOpen(true), []);

  return { isOpen, start, finish };
}

export function restartOnboarding() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("ds_onboarding_completed");
  }
}
