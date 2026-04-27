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
    const t = setTimeout(() => setDone(true), 1100);
    return () => clearTimeout(t);
  }, []);

  if (done || !shown) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center pointer-events-none">
      <div className="w-72 max-w-[80vw]">
        <div className="lcars-label text-lcars-orange text-xs mb-2">LCARS 03-0490 ⌁ INITIALIZING</div>
        <div className="h-3 bg-black border border-lcars-orange/40 overflow-hidden">
          <div className="h-full bg-lcars-orange origin-left animate-lcars-boot" />
        </div>
        <div className="lcars-mono text-[10px] text-lcars-cyan mt-2">
          STARDATE {(Math.random() * 99999).toFixed(2)} ⌁ SUBSPACE LINK NOMINAL
        </div>
      </div>
    </div>
  );
}
