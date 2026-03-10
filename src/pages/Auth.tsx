import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";

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
    <div className="relative flex min-h-screen items-center justify-center bg-mesh p-4 overflow-hidden">
      {/* Floating gradient blobs */}
      <div className="gradient-blob gradient-blob-cyan w-72 h-72 -top-20 -left-20" style={{ animationDelay: '0s' }} />
      <div className="gradient-blob gradient-blob-pink w-96 h-96 -bottom-32 -right-20" style={{ animationDelay: '4s' }} />
      <div className="gradient-blob gradient-blob-purple w-64 h-64 top-1/3 right-1/4" style={{ animationDelay: '8s' }} />

      <div className="relative z-10 w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-foreground neon-glow">Drip Slayer</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your AI-powered wardrobe companion</p>
        </div>

        <div className="glass-card gradient-border rounded-2xl p-6 shadow-glass">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/50 backdrop-blur-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-background/50 backdrop-blur-sm" />
            </div>

            {!isLogin && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary underline underline-offset-2" target="_blank">
                    Terms of Service & EULA
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary underline underline-offset-2" target="_blank">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            )}

            <Button type="submit" className="w-full neon-gradient-cyan-pink text-white border-0 hover:opacity-90 transition-opacity" disabled={loading || (!isLogin && !agreedToTerms)}>
              {loading ? "..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => { setIsLogin(!isLogin); setAgreedToTerms(false); }} className="font-medium text-accent underline-offset-4 hover:underline">
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        <div className="text-center text-[11px] text-muted-foreground space-x-3">
          <Link to="/terms" className="hover:text-foreground underline-offset-2 hover:underline">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-foreground underline-offset-2 hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
