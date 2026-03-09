import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (value: "all" | "essential") => {
    localStorage.setItem("cookie-consent", value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card p-4 shadow-lg animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-card-foreground">🍪 Cookie Preferences</p>
          <p className="text-xs text-muted-foreground">
            We use essential cookies for authentication. Optional analytics cookies help us improve the experience.{" "}
            <Link to="/privacy" className="text-primary underline underline-offset-2">Privacy Policy</Link>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={() => accept("essential")}>
            Essential Only
          </Button>
          <Button size="sm" onClick={() => accept("all")}>
            Accept All
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => accept("essential")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
