import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import LcarsStandaloneShell from "@/components/lcars/LcarsStandaloneShell";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const recordConsent = async (userId: string) => {
    try {
      await supabase.from("user_consents" as any).insert({
        user_id: userId,
        consent_type: "terms_and_privacy",
        user_agent: navigator.userAgent,
      });
    } catch {
      // Non-blocking
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !agreedToTerms) {
      toast.error("You must agree to the Terms of Service and Privacy Policy to create an account.");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/wardrobe");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.user) {
          await recordConsent(data.user.id);
        }
        toast.success("Account created! Signing you in…");
        navigate("/wardrobe");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LcarsStandaloneShell
      title="AUTHORIZATION"
      subtitle={isLogin ? "ACCESS GRANT" : "CREW INTAKE"}
      headerColor="orange"
      topColor="orange"
      sideColor="lavender"
      bottomColor="cyan"
      maxWidth="md"
    >
      <div className="space-y-6 py-2">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-lcars-peach uppercase tracking-widest">
            Drip Slayer
          </h1>
          <p className="mt-2 lcars-mono text-[11px] text-lcars-cyan/80 uppercase">
            ⌁ Stardate · {new Date().toISOString().slice(0, 10).replace(/-/g, ".")}
          </p>
        </div>

        <div className="border-2 border-lcars-orange/60 bg-black/60 p-5 space-y-4">
          <div className="lcars-label text-[10px] text-lcars-orange flex items-center justify-between">
            <span>{isLogin ? "RETURNING OFFICER" : "NEW APPLICATION"}</span>
            <span className="lcars-numerals">FORM-2-{isLogin ? "01" : "02"}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="lcars-label text-[10px] text-lcars-cyan">
                Email Channel
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="lcars-label text-[10px] text-lcars-cyan">
                Access Code
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="terms"
                  className="text-xs text-muted-foreground leading-tight cursor-pointer"
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="text-lcars-cyan underline underline-offset-2"
                    target="_blank"
                  >
                    Terms of Service &amp; EULA
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="text-lcars-cyan underline underline-offset-2"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (!isLogin && !agreedToTerms)}
            >
              {loading ? "..." : isLogin ? "ENGAGE" : "INITIATE"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setAgreedToTerms(false);
              }}
              className="font-medium text-lcars-yellow underline-offset-4 hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        <div className="text-center text-[11px] text-muted-foreground space-x-3">
          <Link to="/terms" className="hover:text-foreground underline-offset-2 hover:underline">
            Terms of Service
          </Link>
          <Link to="/privacy" className="hover:text-foreground underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </LcarsStandaloneShell>
  );
}
