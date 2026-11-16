import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from './preflight.mjs';

const origin = 'https://api.revenuecat.com';
const encode = encodeURIComponent;

export function revenueCatClient(token, fetchImpl = fetch) {
  if (!token?.trim()) throw new Error('REVENUECAT_V2_API_KEY is required in the secure environment.');
  async function request(path, body) {
    const url = new URL(path, origin);
    if (url.origin !== origin || !url.pathname.startsWith('/v2/')) throw new Error('Rejected an unexpected API origin or path.');
    const response = await fetchImpl(url.href, {
      method: body === undefined ? 'GET' : 'POST', redirect: 'error',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(30000),
    });
    // Do not log server response bodies: credential-setting endpoints may echo values.
    if (!response.ok) throw new Error(`RevenueCat ${body === undefined ? 'GET' : 'POST'} ${url.pathname} failed (HTTP ${response.status}). No mutation was retried.`);
    return response.status === 204 ? null : response.json();
  }
  async function list(path) {
    const expectedPath = new URL(path, origin).pathname;
    const seen = new Set();
    const items = [];
    let next = path;
    while (next) {
      const url = new URL(next, origin);
      if (url.origin !== origin || url.pathname !== expectedPath || seen.has(url.href)) throw new Error('Rejected invalid or repeating RevenueCat pagination.');
      seen.add(url.href);
      const page = await request(url.href);
      if (!Array.isArray(page?.items)) throw new Error('RevenueCat returned an invalid list; stopping before creating duplicates.');
      items.push(...page.items);
      next = page.next_page;
    }
    return items;
  }
  return { request, list };
}

function one(items, predicate, label) {
  const matches = items.filter(predicate);
  if (matches.length > 1) throw new Error(`Multiple matching ${label}; supply the exact project ID or resolve the ambiguity.`);
  const match = matches[0];
  if (match?.state === 'archived') throw new Error(`The matching ${label} is archived; leaving it unchanged.`);
  return match;
}

export async function configureRevenueCat({ token, projectId, fetchImpl, settings = config }) {
  const api = revenueCatClient(token, fetchImpl);
  const projects = await api.list('/v2/projects?limit=100');
  let project = one(projects, p => projectId ? p.id === projectId : p.name === settings.revenuecat_project_name, 'project');
  if (projectId && !project) throw new Error('The requested project is not accessible.');
  if (project && project.name !== settings.revenuecat_project_name) throw new Error('The requested project name does not match Drip Slayer.');
  if (!project) project = await api.request('/v2/projects', { name: settings.revenuecat_project_name });
  const base = `/v2/projects/${encode(project.id)}`;
  const apps = await api.list(`${base}/apps?limit=100`);
  let app = one(apps, a => a.type === 'app_store' && a.app_store?.bundle_id === settings.bundle_id, 'iOS app');
  if (!app) app = await api.request(`${base}/apps`, { name: settings.name, type: 'app_store', app_store: { bundle_id: settings.bundle_id } });

  const offerings = await api.list(`${base}/offerings?limit=100`);
  let offering = one(offerings, o => o.lookup_key === settings.offering, 'offering');
  if (offerings.some(o => o.is_current && o.id !== offering?.id)) throw new Error('A different offering is already current; leaving it unchanged.');
  const products = await api.list(`${base}/products?app_id=${encode(app.id)}&limit=100`);
  const selected = [];
  for (const spec of settings.products) {
    let product = one(products, p => p.app_id === app.id && p.store_identifier === spec.id, 'product');
    if (product && product.type !== 'subscription') throw new Error('An existing product has the wrong type.');
    if (!product) product = await api.request(`${base}/products`, { app_id: app.id, store_identifier: spec.id, type: 'subscription', display_name: spec.name });
    selected.push({ spec, product });
  }
  const entitlements = await api.list(`${base}/entitlements?limit=100`);
  let entitlement = one(entitlements, e => e.lookup_key === settings.entitlement, 'entitlement');
  if (!entitlement) entitlement = await api.request(`${base}/entitlements`, { lookup_key: settings.entitlement, display_name: 'Drip Slayer Pro' });
  const attached = await api.list(`${base}/entitlements/${encode(entitlement.id)}/products?limit=100`);
  const missing = selected.map(({ product }) => product.id).filter(id => !attached.some(p => p.id === id));
  if (missing.length) await api.request(`${base}/entitlements/${encode(entitlement.id)}/actions/attach_products`, { product_ids: missing });

  if (!offering) offering = await api.request(`${base}/offerings`, { lookup_key: settings.offering, display_name: 'Drip Slayer Pro plans' });
  const packages = await api.list(`${base}/offerings/${encode(offering.id)}/packages?limit=100`);
  for (const [index, { spec, product }] of selected.entries()) {
    let pack = one(packages, p => p.lookup_key === spec.package, 'package');
    if (!pack) pack = await api.request(`${base}/offerings/${encode(offering.id)}/packages`, { lookup_key: spec.package, display_name: spec.name, position: index + 1 });
    const associations = await api.list(`${base}/packages/${encode(pack.id)}/products?limit=100`);
    if (associations.some(a => a.product?.app_id === app.id && a.product.id !== product.id)) throw new Error('This package already contains a different iOS product; leaving it unchanged.');
    if (!associations.some(a => a.product?.id === product.id)) await api.request(`${base}/packages/${encode(pack.id)}/actions/attach_products`, { products: [{ product_id: product.id, eligibility_criteria: 'all' }] });
  }
  // Make the offering current only after its packages and entitlement are linked.
  if (!offering.is_current) await api.request(`${base}/offerings/${encode(offering.id)}`, { is_current: true });
  const keys = await api.list(`${base}/apps/${encode(app.id)}/public_api_keys?limit=100`);
  const sdk = one(keys, k => k.environment === 'production' && k.app_id === app.id && /^appl_[A-Za-z0-9]+$/.test(k.key), 'public Apple SDK key');
  return { project_id: project.id, app_id: app.id, offering_id: offering.id, entitlement_id: entitlement.id,
    product_ids: selected.map(p => p.product.id), public_sdk_key: sdk?.key,
    status: 'revenuecat_catalog_configured',
    remaining: ['Apple store credentials and restore/transfer policy', 'App Store Connect product creation, pricing and review details', 'Runtime backend secret and sandbox purchase verification'] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    if (!process.argv.includes('--apply')) {
      console.log(JSON.stringify({ status: 'plan_only', settings: config, writes_performed: false, required_access: 'RevenueCat v2 API key with project-configuration read/write permissions' }, null, 2));
    } else {
      const result = await configureRevenueCat({ token: process.env.REVENUECAT_V2_API_KEY, projectId: process.env.REVENUECAT_PROJECT_ID });
      const { public_sdk_key: sdkKey, ...summary } = result;
      if (process.argv.includes('--write-sdk-env')) {
        if (!sdkKey) throw new Error('Catalog configured, but no unambiguous production Apple SDK key was returned.');
        const path = '.env.production.local';
        const existing = existsSync(path) ? readFileSync(path, 'utf8') : '';
        const entry = existing.match(/^VITE_REVENUECAT_APPLE_API_KEY=(.*)$/m);
        if (entry && entry[1].replace(/^['"]|['"]$/g, '') !== sdkKey) throw new Error('Existing Apple SDK key differs; preserving the environment file.');
        if (!entry) writeFileSync(path, `${existing}${existing.endsWith('\n') || !existing ? '' : '\n'}VITE_REVENUECAT_APPLE_API_KEY=${sdkKey}\n`, { mode: 0o600 });
        summary.sdk_env_file = path;
      }
      console.log(JSON.stringify({ ...summary, public_sdk_key_available: !!sdkKey }, null, 2));
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
