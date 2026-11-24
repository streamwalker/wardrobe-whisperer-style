import { isIOSApp } from "@/lib/platform";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const STRIPE_PLANS = {
  monthly: {
    price_id: "price_1TAfkODHerWbKqqdJeT0m2uz",
    product_id: "prod_U8xfLB09dI8Bm0",
    label: "Monthly",
    price: "$4.99",
    interval: "month",
  },
  annual: {
    price_id: "price_1TAfleDHerWbKqqddwrzsLjs",
    product_id: "prod_U8xhb9LeO0Rrdj",
    label: "Annual",
    price: "$39.99",
    interval: "year",
    savings: "Save 33%",
  },
} as const;

export interface SubscriptionData {
  subscribed: boolean;
  product_id?: string | null;
  price_id?: string | null;
  subscription_end?: string | null;
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const provider = isIOSApp() ? "apple" : "stripe";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["subscription", user?.id, provider],
    queryFn: async (): Promise<SubscriptionData> => {
      const { data, error } = await supabase.functions.invoke(isIOSApp() ? "check-app-subscription" : "check-subscription");
      if (error) throw error;
      if (!data || typeof data.subscribed !== "boolean") {
        throw new Error("Subscription verification unavailable");
      }
      return data as SubscriptionData;
    },
    enabled: !!user,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Missing/failed verification is never evidence that an account is free.
  const status = authLoading ? "checking" : !user ? "signed-out" : isError ? "unavailable"
    : isLoading || !data ? "checking" : data.subscribed ? "pro" : "free";
  const isPro = status === "pro";

  const currentPlan = isPro && isIOSApp() ? "Apple subscription" : isPro
    ? data?.price_id === STRIPE_PLANS.annual.price_id
      ? "annual"
      : "monthly"
    : null;

  return {
    isPro,
    status,
    isLoading: status === "checking",
    isUnavailable: status === "unavailable",
    subscription: data ?? null,
    currentPlan,
    refetch,
  };
}
