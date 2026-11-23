import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Matches App Store Connect app 6835746469.
  appId: 'com.streamwalkers.dripslayer',
  appName: 'Drip Slayer',
  webDir: 'dist',
  ios: { contentInset: 'never', backgroundColor: '#101014' },
};
export default config;
