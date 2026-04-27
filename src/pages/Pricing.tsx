import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, STRIPE_PLANS } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LcarsSection } from "@/components/lcars/LcarsSection";

const FREE_FEATURES = [
  "Up to 20 wardrobe items",
  "Manual outfit saving",
  "3 AI outfit matches / month",
  "Share your wardrobe",
  "Drag & drop organization",
];

const PRO_FEATURES = [
  "Unlimited wardrobe items",
  "Unlimited AI outfit matching",
  "Shopping Mode (AI analyze & match)",
  "Occasion-based suggestions",
  "Export outfits as PDF",
  "Priority AI processing",
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isPro, currentPlan, isLoading: subLoading } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planKey: "monthly" | "annual") => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoadingPlan(planKey);
    try {
      const plan = STRIPE_PLANS[planKey];
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: plan.price_id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <LcarsSection
      title="TIER UPGRADE"
      subtitle="SECTOR 99 · COMMERCE"
      headerColor="amber"
      topColor="steel"
      sideColor="amber"
      bottomColor="slate"
      variant="rounded"
    >
    <div className="space-y-8 pb-8 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h2 className="font-display text-3xl font-semibold text-foreground">
          Upgrade to Pro
        </h2>
        <p className="text-sm text-muted-foreground">
          Unlock unlimited AI styling and the full Drip Slayer experience.
        </p>
      </div>

      {/* Free Tier */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">Free</h3>
            <p className="text-2xl font-bold text-foreground">$0</p>
          </div>
          {!isPro && !subLoading && (
            <Badge variant="secondary">Current Plan</Badge>
          )}
        </div>
        <ul className="space-y-2">
          {FREE_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/60" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Pro Tier */}
      <div className="glass-card gradient-border rounded-2xl p-5 space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0">
          <div className="neon-gradient-cyan-pink text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
            RECOMMENDED
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-neon-cyan" />
          <h3 className="font-display text-lg font-semibold text-foreground">Pro</h3>
          {isPro && <Badge className="neon-gradient-cyan-pink text-white border-0">Active</Badge>}
        </div>

        <ul className="space-y-2">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-foreground">
              <Zap className="h-4 w-4 mt-0.5 shrink-0 text-neon-cyan" />
              {f}
            </li>
          ))}
        </ul>

        {isPro ? (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              You're on the <span className="font-semibold text-foreground capitalize">{currentPlan}</span> plan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleCheckout("monthly")}
              disabled={!!loadingPlan}
              variant="outline"
              className="flex flex-col h-auto py-3 gap-0.5"
            >
              {loadingPlan === "monthly" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span className="text-lg font-bold">$4.99</span>
                  <span className="text-[10px] text-muted-foreground">per month</span>
                </>
              )}
            </Button>
            <Button
              onClick={() => handleCheckout("annual")}
              disabled={!!loadingPlan}
              variant="neon"
              className={cn("flex flex-col h-auto py-3 gap-0.5 relative")}
            >
              {loadingPlan === "annual" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span className="text-lg font-bold">$39.99</span>
                  <span className="text-[10px] opacity-80">per year — Save 33%</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
    </LcarsSection>
  );
}
