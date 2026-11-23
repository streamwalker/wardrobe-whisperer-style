import { Link } from "react-router-dom";
import LcarsStandaloneShell from "@/components/lcars/LcarsStandaloneShell";

export default function Support() {
  return (
    <LcarsStandaloneShell title="DRIP SLAYER SUPPORT" subtitle="HERE TO HELP" maxWidth="lg">
      <div className="space-y-8 py-4 text-foreground/90">
        <header className="space-y-3">
          <h1 className="font-display text-3xl font-semibold">How can we help?</h1>
          <p>Get help with your wardrobe, account, or Drip Slayer Pro subscription.</p>
          <a className="inline-flex rounded-full border border-white/30 px-5 py-3 underline underline-offset-4" href="mailto:Support@streamwalkers.com?subject=Drip%20Slayer%20Support">Support@streamwalkers.com</a>
          <p className="text-sm text-muted-foreground">Include what happened and your device model. Please do not send passwords or payment card details.</p>
        </header>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Subscriptions and purchases</h2>
          <p>For Apple purchases, open Settings on your iPhone or iPad, tap your name, then Subscriptions to manage or cancel Drip Slayer Pro. To restore a purchase, sign in to the original Drip Slayer account and use Restore Purchases on the Pro screen.</p>
          <p>Deleting your Drip Slayer account does not cancel an Apple subscription.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Your account and data</h2>
          <p>Use Profile → Data &amp; Privacy to export your data or delete your account. If you cannot sign in or need help with a privacy request, contact our support email above.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Apple devices and Siri</h2>
          <p>The iOS app adapts to iPhone and iPad windows, including folding and resizing. On iPhone, open Your outfits and choose Use with Siri on a saved outfit. Then say “Read my outfit in Drip Slayer.” This selected outfit is available for 24 hours; Clear Siri selection removes it sooner.</p>
          <p>HomePod requires Personal Requests and the associated iPhone. Siri availability on HomePod and HomeView depends on your Apple setup and software. On HomeView, you can also open dripslayer.streamwalkers.com in Safari and sign in to use the web wardrobe. Drip Slayer is not a standalone HomeView app.</p>
        </section>
        <nav aria-label="Support links" className="flex flex-wrap gap-6 underline underline-offset-4">
          <Link to="/">Drip Slayer home</Link>
          <Link to="/privacy">Privacy policy</Link>
          <Link to="/terms">Terms of service</Link>
        </nav>
      </div>
    </LcarsStandaloneShell>
  );
}
