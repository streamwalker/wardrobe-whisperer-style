import { REVENUECAT_APPLE_PUBLIC_KEY } from "../../supabase/functions/_shared/revenuecat-public.ts";
import { Purchases } from '@revenuecat/purchases-capacitor';
import { isIOSApp } from './platform';
let configured: Promise<void> | undefined;
export async function identifyPurchaser(userId: string) {
  if (!isIOSApp()) throw new Error('Apple purchases are available in the iOS app.');
  const apiKey = import.meta.env.VITE_REVENUECAT_APPLE_API_KEY || REVENUECAT_APPLE_PUBLIC_KEY;
  if (!apiKey) throw new Error('Subscriptions are not available yet. Please try again later.');
  if (!configured) {
    configured = Purchases.configure({ apiKey, appUserID: userId }).catch(error => { configured = undefined; throw error; });
  }
  await configured;
  await Purchases.logIn({ appUserID: userId });
}
export { Purchases };
