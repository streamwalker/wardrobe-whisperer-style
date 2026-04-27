import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import LcarsStandaloneShell from "@/components/lcars/LcarsStandaloneShell";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <LcarsStandaloneShell
      title="RED ALERT · SECTOR NOT FOUND"
      subtitle="UNCHARTED SPACE"
      headerColor="red"
      topColor="red"
      sideColor="yellow"
      bottomColor="red"
      maxWidth="md"
    >
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="text-7xl font-display text-lcars-red animate-lcars-pulse">404</div>
        <p className="lcars-label text-sm text-lcars-peach">
          REQUESTED COORDINATES UNKNOWN
        </p>
        <p className="text-sm text-muted-foreground max-w-sm">
          The route{" "}
          <span className="lcars-mono text-lcars-cyan">{location.pathname}</span> is
          not part of this LCARS console.
        </p>
        <Link
          to="/wardrobe"
          className="lcars-pill bg-lcars-orange text-black px-5 h-10 inline-flex items-center lcars-label text-xs hover:brightness-110"
        >
          RETURN TO WARDROBE
        </Link>
      </div>
    </LcarsStandaloneShell>
  );
};

export default NotFound;
