import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { inspectReleaseEnvironment, requiredSecrets, config } from './preflight.mjs';
import { revenueCatClient, configureRevenueCat } from './revenuecat.mjs';

test('release preflight reports only names and refuses missing credentials', () => {
  const result = inspectReleaseEnvironment({});
  assert.equal(result.ready, false);
  assert.deepEqual(result.missing, requiredSecrets);
  const wrongKey = inspectReleaseEnvironment({ VITE_REVENUECAT_APPLE_API_KEY: 'test_DO_NOT_EXPOSE' });
  assert.ok(wrongKey.invalid.includes('VITE_REVENUECAT_APPLE_API_KEY'));
  assert.ok(!JSON.stringify(wrongKey).includes('DO_NOT_EXPOSE'));
});

test('release preflight accepts a P-256 App Store key and rejects malformed build numbers', () => {
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const env = Object.fromEntries(requiredSecrets.map(name => [name, 'placeholder']));
  Object.assign(env, { ASC_API_KEY_ID: 'A1B2C3D4E5', ASC_ISSUER_ID: '11111111-2222-4333-8444-555555555555',
    ASC_PRIVATE_KEY_BASE64: Buffer.from(privateKey.export({ type: 'pkcs8', format: 'pem' })).toString('base64'),
    VITE_REVENUECAT_APPLE_API_KEY: 'appl_example', RELEASE_BUILD_NUMBER: '12' });
  assert.equal(inspectReleaseEnvironment(env).ready, true);
  assert.ok(inspectReleaseEnvironment({ ...env, RELEASE_BUILD_NUMBER: '12; echo unsafe' }).invalid.includes('RELEASE_BUILD_NUMBER'));
});

test('RevenueCat pagination cannot forward credentials to another origin', async () => {
  const calls = [];
  const client = revenueCatClient('private-test-token', async url => {
    calls.push(url);
    return Response.json({ items: [], next_page: 'https://example.invalid/collect' });
  });
  await assert.rejects(client.list('/v2/projects'), /pagination/);
  assert.deepEqual(calls, ['https://api.revenuecat.com/v2/projects']);
});

test('RevenueCat errors omit response bodies and do not retry writes', async () => {
  let count = 0;
  const client = revenueCatClient('private-test-token', async () => {
    count++;
    return Response.json({ token: 'SECRET_VALUE' }, { status: 503 });
  });
  await assert.rejects(client.request('/v2/projects', { name: 'Drip Slayer' }), error => {
    assert.match(error.message, /HTTP 503/);
    assert.ok(!error.message.includes('SECRET_VALUE'));
    return true;
  });
  assert.equal(count, 1);
});

function fakeRevenueCat() {
  const collections = new Map([['/v2/projects', []]]);
  const writes = [];
  let nextId = 0;
  const fetchImpl = async (url, options) => {
    assert.equal(new URL(url).origin, 'https://api.revenuecat.com');
    const path = new URL(url).pathname;
    if (options.method === 'GET') return Response.json({ items: collections.get(path) ?? [], next_page: null });
    const body = JSON.parse(options.body);
    writes.push({ path, body });
    if (path.endsWith('/actions/attach_products')) {
      const productPath = path.replace('/actions/attach_products', '/products');
      const products = collections.get('/v2/projects/id1/products') ?? [];
      const links = body.product_ids
        ? products.filter(p => body.product_ids.includes(p.id))
        : body.products.map(p => ({ product: products.find(item => item.id === p.product_id), eligibility_criteria: p.eligibility_criteria }));
      collections.set(productPath, [...(collections.get(productPath) ?? []), ...links]);
      return Response.json({});
    }
    if (body.is_current) {
      const offerings = collections.get('/v2/projects/id1/offerings');
      const offering = offerings.find(p => path.endsWith(`/${p.id}`));
      offering.is_current = true;
      return Response.json(offering);
    }
    const created = { id: `id${++nextId}`, ...body };
    collections.set(path, [...(collections.get(path) ?? []), created]);
    return Response.json(created, { status: 201 });
  };
  return { fetchImpl, writes, collections };
}

test('RevenueCat setup reuses its catalog on rerun and activates only after package links exist', async () => {
  const fake = fakeRevenueCat();
  const first = await configureRevenueCat({ token: 'private-test-token', fetchImpl: fake.fetchImpl });
  const writesAfterFirstRun = fake.writes.length;
  assert.equal(first.status, 'revenuecat_catalog_configured');
  assert.equal(first.product_ids.length, 2);
  assert.deepEqual(fake.writes.at(-1).body, { is_current: true });
  assert.equal(fake.writes.filter(w => w.body.products).length, 2);
  const second = await configureRevenueCat({ token: 'private-test-token', fetchImpl: fake.fetchImpl });
  assert.equal(second.project_id, first.project_id);
  assert.equal(fake.writes.length, writesAfterFirstRun);
});

test('RevenueCat setup stops on ambiguous project identity before writing', async () => {
  const fake = fakeRevenueCat();
  fake.collections.set('/v2/projects', [{ id: 'one', name: config.revenuecat_project_name }, { id: 'two', name: config.revenuecat_project_name }]);
  await assert.rejects(configureRevenueCat({ token: 'private-test-token', fetchImpl: fake.fetchImpl }), /Multiple matching project/);
  assert.equal(fake.writes.length, 0);
});
