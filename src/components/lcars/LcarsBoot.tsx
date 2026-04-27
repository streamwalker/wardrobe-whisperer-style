import { useEffect, useState } from "react";

/** One-shot LCARS boot sequence shown on first session render. */
export default function LcarsBoot() {
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("lcars-booted") === "1") {
      setDone(true);
      return;
    }
    setShown(true);
    sessionStorage.setItem("lcars-booted", "1");
    const t = setTimeout(() => setDone(true), 1400);
    return () => clearTimeout(t);
  }, []);

  if (done || !shown) return null;

  const stardate = (Math.random() * 99999).toFixed(2);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center pointer-events-none">
      <div className="w-80 max-w-[85vw] space-y-3">
        <div className="lcars-label text-titan-amber text-xs">
          LCARS 03-0490 ⌁ INITIALIZING SUBSPACE LINK
        </div>

        {/* Tri-bar boot sequence (slate / amber / teal) */}
        <div className="space-y-1">
          <div className="h-2 bg-titan-rail border border-titan-steel/60 overflow-hidden">
            <div
              className="h-full bg-titan-steel origin-left animate-lcars-boot"
              style={{ animationDuration: "0.45s" }}
            />
          </div>
          <div className="h-2 bg-titan-rail border border-titan-steel/60 overflow-hidden">
            <div
              className="h-full bg-titan-amber origin-left animate-lcars-boot"
              style={{ animationDelay: "0.25s", animationDuration: "0.5s" }}
            />
          </div>
          <div className="h-2 bg-titan-rail border border-titan-steel/60 overflow-hidden">
            <div
              className="h-full bg-titan-teal origin-left animate-lcars-boot"
              style={{ animationDelay: "0.5s", animationDuration: "0.55s" }}
            />
          </div>
        </div>

        <div className="lcars-mono text-[10px] text-titan-frost/85 leading-relaxed">
          <div>U.S.S. TITAN NCC-80102-A ⌁ SENSOR ARRAYS NOMINAL</div>
          <div className="text-titan-teal">STARDATE {stardate} ⌁ ALPHA SHIFT ENGAGED</div>
        </div>
      </div>
    </div>
  );
}
