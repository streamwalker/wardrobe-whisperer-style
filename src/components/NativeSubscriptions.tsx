import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { identifyPurchaser, Purchases } from '@/lib/native-purchases';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function NativeSubscriptions() {
  const { user } = useAuth();
  const { refetch } = useSubscription();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const userId = user?.id;
  useEffect(() => {
    let active = true;
    setLoading(true);
    if (!userId) { setLoading(false); return; }
    (async () => {
      try {
        await identifyPurchaser(userId);
        const offerings = await Purchases.getOfferings();
        if (active) {
          setPackages(offerings.current?.availablePackages ?? []);
          if (!offerings.current?.availablePackages.length) setError('Subscriptions are not available yet. Please try again later.');
        }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Unable to load subscriptions.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [userId]);
  async function purchase(pkg?: PurchasesPackage) {
    if (!user) { navigate('/auth'); return; }
    setBusy(true);
    try {
      await identifyPurchaser(user.id);
      const result = pkg ? await Purchases.purchasePackage({ aPackage: pkg }) : await Purchases.restorePurchases();
      if (result.customerInfo.entitlements.active.pro) {
        const verified = await refetch();
        if (verified.error) throw new Error('Purchase received. We could not verify access yet; try Restore Purchases shortly.');
        toast.success(verified.data?.subscribed ? 'Pro is ready to use.' : 'Purchase received. Your access is syncing; try Restore Purchases shortly.');
      } else toast.info(pkg ? 'Your purchase is pending approval.' : 'No active Pro subscription was found for this Apple account.');
    } catch (e) {
      if (!(e as { userCancelled?: boolean }).userCancelled) toast.error(e instanceof Error ? e.message : 'Unable to complete this request.');
    } finally { setBusy(false); }
  }
  return <div className="glass-card space-y-4 p-5">
    <h3 className="text-xl font-semibold">Drip Slayer Pro</h3>
    <p className="text-sm text-muted-foreground">Unlimited wardrobe items and AI outfit matching, shopping analysis, occasion suggestions, and PDF outfit exports.</p>
    {!user ? <Button onClick={() => navigate('/auth')}>Sign in to see subscriptions</Button> : loading ? <p role="status">Loading subscriptions…</p> : error ? <p role="status" className="text-sm text-muted-foreground">{error}</p> : <div className="grid gap-3">{packages.map(pkg => <Button key={pkg.identifier} disabled={busy} onClick={() => purchase(pkg)} className="h-auto min-h-14 flex-col py-3"><span>{pkg.product.title}</span><span>{pkg.product.priceString}{pkg.packageType === 'MONTHLY' ? ' / month' : pkg.packageType === 'ANNUAL' ? ' / year' : ''}</span></Button>)}</div>}
    <Button variant="outline" disabled={busy || loading} onClick={() => purchase()}>Restore Purchases</Button>
    <a href="https://apps.apple.com/account/subscriptions" className="block text-sm text-primary underline">Manage Apple subscriptions</a>
    <p className="text-xs leading-relaxed text-muted-foreground">Payment is charged to your Apple Account on confirmation. Subscriptions renew automatically unless canceled at least 24 hours before the current period ends. Manage or cancel in your Apple account settings.</p>
    <div className="flex gap-4 text-xs text-primary underline"><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms of Service</Link><a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Apple Standard EULA</a></div>
  </div>;
}
