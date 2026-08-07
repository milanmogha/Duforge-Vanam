// test/integration.test.js
// Boots the real server against an isolated test database (vanam_test) and
// exercises security, auth, commerce, payment authority, and the new features
// over HTTP. Requires a local MongoDB on 127.0.0.1:27017.
//
// Run: npm test   (or: npm run test:integration)

// Runs the app IN-PROCESS (no child spawn): set env, connect Mongo, app.listen(0).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Env must be set BEFORE importing the app (validateEnv runs at import).
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/vanam_test';
process.env.JWT_SECRET = 'integration-test-secret-key-please-change-0123456789';
process.env.NODE_ENV = 'development';
process.env.ALLOW_DEV_LOGIN = 'true';
process.env.SMS_DEV_MODE = 'true';

let BASE;
let httpServer;
let mongoose;

const jsonPost = (path, body, token) =>
  fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
const get = (path, token) =>
  fetch(`${BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

before(async () => {
  // The test DB (vanam_test) must be seeded first — `npm run test:integration` does this.
  mongoose = (await import('mongoose')).default;
  await mongoose.connect(process.env.MONGO_URI);
  const { app } = await import('../index.js');
  httpServer = app.listen(0);
  await new Promise((res) => httpServer.once('listening', res));
  BASE = `http://127.0.0.1:${httpServer.address().port}`;

  const products = await (await get('/api/products')).json();
  assert.ok(Array.isArray(products) && products.length > 0,
    'test DB not seeded — run `npm run test:seed` (npm test does this).');
});

after(async () => {
  if (httpServer) await new Promise((res) => httpServer.close(res));
  if (mongoose) await mongoose.disconnect();
});

// ── helpers to obtain tokens ──────────────────────────────────────
const devLogin = async (role) => (await (await jsonPost('/api/auth/dev-login', { role })).json()).token;
const adminLogin = async () =>
  (await (await jsonPost('/api/admin/login', { email: 'admin@admin.com', password: 'admin' })).json()).token;
const firstProductId = async () => (await (await get('/api/products')).json())[0]._id;
const firstAddressId = async (token) => {
  const list = await (await get('/api/addresses', token)).json();
  return Array.isArray(list) && list[0] ? list[0]._id : null;
};

// ── Auth ──────────────────────────────────────────────────────────
test('admin login with seeded credentials succeeds', async () => {
  const token = await adminLogin();
  assert.ok(token, 'expected an admin token');
});

test('dev-login issues a customer token', async () => {
  const token = await devLogin('customer');
  assert.ok(token);
});

// ── Security / RBAC ───────────────────────────────────────────────
test('product write is rejected without auth (401)', async () => {
  const r = await jsonPost('/api/products', { name: 'x', category: 'y', price: 1, stock: 1 });
  assert.equal(r.status, 401);
});

test('customer cannot reach admin sample/quote endpoints (403)', async () => {
  const token = await devLogin('customer');
  assert.equal((await get('/api/samples/admin', token)).status, 403);
  assert.equal((await get('/api/quotes/admin', token)).status, 403);
});

test('regex search payload is handled safely (no crash, 200)', async () => {
  const r = await get(`/api/products?search=${encodeURIComponent('(.*+)+')}`);
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.ok(Array.isArray(data));
});

// ── Commerce: server price authority ──────────────────────────────
test('COD order recomputes total server-side and ignores a forged client total', async () => {
  const token = await devLogin('customer');
  const productId = await firstProductId();
  const addressId = await firstAddressId(token);
  assert.ok(addressId, 'demo customer should have a seeded address');
  const r = await jsonPost('/api/orders', {
    userAddress: addressId,
    products: [{ product: productId, quantity: 1 }],
    paymentMethod: 'CashOnDelivery',
    paymentBreakdown: { itemsTotal: 1, tax: 0, shipping: 0, discount: 0, total: 1 },
  }, token);
  assert.equal(r.status, 201);
  const order = await r.json();
  assert.ok(order.paymentBreakdown.total > 1, 'server must not trust the client total of 1');
});

test('coupon WELCOME10 applies a discount', async () => {
  const token = await devLogin('customer');
  const r = await jsonPost('/api/coupons/apply', { code: 'WELCOME10', orderTotal: 80000 }, token);
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.ok(data.discount > 0);
});

// ── Projects: ownership / IDOR ────────────────────────────────────
test('a project is only visible to its owner (IDOR-safe)', async () => {
  const customer = await devLogin('customer');
  const designer = await devLogin('designer');
  const created = await (await jsonPost('/api/projects', { name: 'Private board' }, customer)).json();
  assert.ok(created._id);
  // Owner can read it; the other user gets 404 (scoped query), never the data.
  assert.equal((await get(`/api/projects/${created._id}`, customer)).status, 200);
  assert.equal((await get(`/api/projects/${created._id}`, designer)).status, 404);
  // Unauthenticated is rejected.
  assert.equal((await get(`/api/projects/${created._id}`)).status, 401);
});

// ── Samples & quotes: create + admin status update ────────────────
test('sample request: customer creates, admin lists and updates status', async () => {
  const customer = await devLogin('customer');
  const admin = await adminLogin();
  const productId = await firstProductId();
  const created = await (await jsonPost('/api/samples', { product: productId, finish: 'walnut' }, customer)).json();
  assert.ok(created._id);
  const list = await (await get('/api/samples/admin', admin)).json();
  assert.ok(list.some((s) => s._id === created._id));
  const upd = await fetch(`${BASE}/api/samples/admin/${created._id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` },
    body: JSON.stringify({ status: 'APPROVED' }),
  });
  assert.equal(upd.status, 200);
  assert.equal((await upd.json()).status, 'APPROVED');
});

test('quote request: customer creates and admin can see it', async () => {
  const customer = await devLogin('customer');
  const admin = await adminLogin();
  const productId = await firstProductId();
  const created = await (await jsonPost('/api/quotes', {
    company: 'Test Studio', projectType: 'commercial',
    items: [{ product: productId, quantity: 25 }], details: 'bulk',
  }, customer)).json();
  assert.ok(created._id);
  const list = await (await get('/api/quotes/admin', admin)).json();
  assert.ok(list.some((q) => q._id === created._id));
});
