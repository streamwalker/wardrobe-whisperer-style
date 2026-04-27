import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import LcarsStandaloneShell from "@/components/lcars/LcarsStandaloneShell";
import { LcarsAlertBanner, LcarsTickRow } from "@/components/lcars/LcarsPrimitives";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <LcarsStandaloneShell
      title="SECTOR NOT FOUND"
      subtitle="UNCHARTED SPACE"
      headerColor="red"
      topColor="red"
      sideColor="amber"
      bottomColor="red"
      maxWidth="md"
      variant="rounded"
    >
      <div className="condition-red p-6">
        <LcarsAlertBanner title="ALERT: CONDITION RED" subtitle="HULL DAMAGE — CRITICAL" />
        <div className="flex flex-col items-center justify-center gap-5 py-10 text-center">
          <div className="text-7xl font-display text-lcars-red lcars-blink-red px-6 py-2 rounded-md">
            404
          </div>
          <p className="lcars-label text-sm text-titan-frost">
            REQUESTED COORDINATES UNKNOWN
          </p>
          <p className="text-sm text-muted-foreground max-w-sm">
            The route{" "}
            <span className="lcars-mono text-titan-teal">{location.pathname}</span> is
            not part of this LCARS console.
          </p>
          <LcarsTickRow className="w-40 opacity-70" />
          <Link
            to="/wardrobe"
            className="lcars-pill bg-lcars-orange text-black px-5 h-10 inline-flex items-center lcars-label text-xs hover:brightness-110"
          >
            RETURN TO WARDROBE
          </Link>
        </div>
      </div>
    </LcarsStandaloneShell>
  );
};

export default NotFound;
