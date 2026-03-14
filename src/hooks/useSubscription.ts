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

interface SubscriptionData {
  subscribed: boolean;
  product_id?: string | null;
  price_id?: string | null;
  subscription_end?: string | null;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async (): Promise<SubscriptionData> => {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      return data as SubscriptionData;
    },
    enabled: !!user,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const isPro = data?.subscribed ?? false;

  const currentPlan = isPro
    ? data?.price_id === STRIPE_PLANS.annual.price_id
      ? "annual"
      : "monthly"
    : null;

  return {
    isPro,
    isLoading,
    subscription: data ?? null,
    currentPlan,
    refetch,
  };
}
