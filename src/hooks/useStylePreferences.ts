import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  buildProfile,
  emptyProfile,
  type PreferenceProfile,
  type SignalRow,
} from "@/lib/preference-profile";

/**
 * Fetches the most recent 200 style_signals for the current user and
 * returns a memoized PreferenceProfile. Cached for 10 minutes.
 *
 * Use `invalidate()` after recording a signal to force a refresh.
 */
export function useStylePreferences(): {
  profile: PreferenceProfile;
  isLoading: boolean;
  invalidate: () => void;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["style-signals", user?.id],
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("style_signals")
        .select("signal_type, weight, item_ids, mood, color_hexes, style_tags, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as SignalRow[];
    },
  });

  const profile = useMemo(() => {
    if (!data || data.length === 0) return emptyProfile();
    return buildProfile(data);
  }, [data]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["style-signals", user?.id] });

  return { profile, isLoading, invalidate };
}
