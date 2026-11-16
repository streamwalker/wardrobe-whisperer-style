import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import LcarsStandaloneShell from "@/components/lcars/LcarsStandaloneShell";
export default function NotFound() {
  return <LcarsStandaloneShell title="A little off course." maxWidth="md">
    <p className="mb-8 text-sm text-muted-foreground">We couldn’t find that page. Your next great look is still waiting.</p>
    <Link to="/" className="cinema-cta">Back to the experience<ArrowUpRight size={18} /></Link>
  </LcarsStandaloneShell>;
}
