import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Provisional: replace with the existing App Store Connect Bundle ID before signing.
  appId: 'com.streamwalkers.dripslayer',
  appName: 'Drip Slayer',
  webDir: 'dist',
  ios: { contentInset: 'automatic', backgroundColor: '#101014' },
};
export default config;
