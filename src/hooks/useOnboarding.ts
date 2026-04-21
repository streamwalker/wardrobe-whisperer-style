import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useOnboarding(opts: {
  userId: string | undefined;
  ready: boolean;
  shouldAutoStart: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!opts.ready || !opts.shouldAutoStart || !opts.userId) return;
    let cancelled = false;
    let timeoutId: number | undefined;

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed_at")
        .eq("user_id", opts.userId!)
        .maybeSingle();

      if (cancelled) return;
      if (error) return;

      if (!data?.onboarding_completed_at) {
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
  }, [opts.ready, opts.shouldAutoStart, opts.userId]);

  const finish = useCallback(async () => {
    setIsOpen(false);
    if (!opts.userId) return;
    await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("user_id", opts.userId);
  }, [opts.userId]);

  const start = useCallback(() => setIsOpen(true), []);

  return { isOpen, start, finish };
}

export async function restartOnboarding(userId: string) {
  await supabase
    .from("profiles")
    .update({ onboarding_completed_at: null })
    .eq("user_id", userId);
}
