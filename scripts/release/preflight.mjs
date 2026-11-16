import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createPrivateKey } from 'node:crypto';

export const config = JSON.parse(readFileSync(new URL('../../deploy/apple-release.json', import.meta.url)));
export const requiredSecrets = [
  'IOS_DISTRIBUTION_P12_BASE64', 'IOS_DISTRIBUTION_P12_PASSWORD',
  'IOS_PROVISIONING_PROFILE_BASE64', 'ASC_API_KEY_ID', 'ASC_ISSUER_ID',
  'ASC_PRIVATE_KEY_BASE64', 'VITE_REVENUECAT_APPLE_API_KEY',
];

export function inspectReleaseEnvironment(env) {
  const missing = requiredSecrets.filter(name => !env[name]?.trim());
  const invalid = [];
  if (env.ASC_API_KEY_ID && !/^[A-Z0-9]{10}$/.test(env.ASC_API_KEY_ID)) invalid.push('ASC_API_KEY_ID');
  if (env.ASC_ISSUER_ID && !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(env.ASC_ISSUER_ID)) invalid.push('ASC_ISSUER_ID');
  if (env.VITE_REVENUECAT_APPLE_API_KEY && !/^appl_[A-Za-z0-9]+$/.test(env.VITE_REVENUECAT_APPLE_API_KEY)) invalid.push('VITE_REVENUECAT_APPLE_API_KEY');
  if (env.ASC_PRIVATE_KEY_BASE64) {
    try {
      const key = createPrivateKey(Buffer.from(env.ASC_PRIVATE_KEY_BASE64, 'base64').toString());
      if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1') invalid.push('ASC_PRIVATE_KEY_BASE64');
    } catch { invalid.push('ASC_PRIVATE_KEY_BASE64'); }
  }
  if (env.RELEASE_BUILD_NUMBER && !/^[1-9][0-9]{0,8}$/.test(env.RELEASE_BUILD_NUMBER)) invalid.push('RELEASE_BUILD_NUMBER');
  return { ready: missing.length === 0 && invalid.length === 0, missing, invalid,
    team_id: config.team_id, bundle_id: config.bundle_id,
    note: 'Checks configuration only. Does not establish certificate validity, store setup, or App Review readiness.' };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = inspectReleaseEnvironment(process.env);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ready) process.exitCode = 1;
}
