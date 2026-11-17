/* eslint-disable @typescript-eslint/no-require-imports -- Exercise Next server modules with mocked external boundaries in the existing tsx/Node runner. */
const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const Module = require('node:module');
const { drizzle } = require('drizzle-orm/pg-proxy');

const USER_A = '11111111-1111-4111-8111-111111111111';
const TENANT_A = '22222222-2222-4222-8222-222222222222';
const TENANT_B = '33333333-3333-4333-8333-333333333333';
let claims;
let authError;
let tokens;
let tenantRows;
let billRows;
let queries;
let failQuery;
const db = drizzle(async (sql, params) => {
  queries.push({ sql, params });
  if (failQuery) throw new Error('Private database failure');
  return { rows: sql.includes('from "tenants"') ? tenantRows : billRows };
});
const originalLoad = Module._load;
const dbPath = require.resolve('../db');
const supabasePath = require.resolve('../lib/supabase/server');
Module._load = function (id, parent, isMain) {
  if (id === 'server-only') return {};
  const resolved = Module._resolveFilename(id, parent);
  if (resolved === dbPath) return { db };
  if (resolved === supabasePath) return { createClient: async () => ({ auth: {
    getClaims: async token => { tokens.push(token); return { data: { claims }, error: authError }; },
  } }) };
  return originalLoad.call(this, id, parent, isMain);
};
let GET;
try { ({ GET } = require('../app/api/tenant/bills/route')); }
finally { Module._load = originalLoad; }

beforeEach(() => {
  claims = { sub: USER_A, email: 'tenant@example.com', role: 'authenticated', user_role: 'tenant' };
  authError = null;
  tokens = [];
  tenantRows = [[TENANT_A, 'Maya Santos', '101']];
  billRows = [
    ['44444444-4444-4444-8444-444444444444', '2026-10-01', '5350.00', '600.00', '250.00', '2350.00', '2026-10-10', null, 'partial'],
    ['55555555-5555-4555-8555-555555555555', '2026-09-01', '5280.00', '530.00', '250.00', '0.00', '2026-09-10', '2026-09-08', 'paid'],
  ];
  queries = [];
  failQuery = false;
});
const request = (query = '') => new Request(`http://localhost/api/tenant/bills${query}`, { headers: { Authorization: 'Bearer test-access-token' } });

test('returns the mobile contract using only the authenticated tenant, ignoring client tenant IDs', async () => {
  const response = await GET(request(`?tenantId=${TENANT_B}&userId=${TENANT_B}`));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  const body = await response.json();
  assert.deepEqual(body.tenant, { name: 'Maya Santos', boardingHouseName: null, roomNumber: '101' });
  assert.equal(body.bills.length, 2);
  assert.equal(body.bills[0].totalAmount, '5350.00');
  assert.equal(body.bills[0].settledDate, null);
  assert.equal(body.bills[1].settledDate, '2026-09-08');
  assert.equal(body.bills[0].status, 'partial');
  assert.deepEqual(tokens, ['test-access-token']);
  assert.match(queries[0].sql, /where "tenants"\."user_id" = \$\d+/);
  assert.ok(queries[0].params.includes(USER_A));
  assert.match(queries[0].sql, /"tenant_room_assignment"\."tenant_id" = "tenants"\."tenant_id"/);
  assert.match(queries[1].sql, /where "bills"\."tenant_id" = \$\d+/);
  assert.deepEqual(queries[1].params, ["0", TENANT_A]);
  assert.ok(!queries.some(query => query.params.includes(TENANT_B)));
  assert.match(queries[1].sql, /order by "bills"\."billing_month" desc/);
  assert.ok(!queries[1].sql.includes('limit'));
  assert.match(queries[1].sql, /case when "status" = 'paid'/);
  assert.match(queries[1].sql, /max\("payment_date"\)/);
  assert.match(queries[1].sql, /"payments"\."bill_id" = "bills"\."bill_id"/);
  assert.match(queries[1].sql, /"payments"\."amount" > \$1/);
});

test('supports a tenant with no bills and no assigned room', async () => {
  tenantRows = [[TENANT_A, 'Maya Santos', null]];
  billRows = [];
  const response = await GET(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { tenant: { name: 'Maya Santos', boardingHouseName: null, roomNumber: null }, bills: [] });
});

test('returns a distinct forbidden response for an account not linked to a tenant', async () => {
  tenantRows = [];
  const response = await GET(request());
  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, 'TENANT_NOT_LINKED');
  assert.equal(queries.length, 1);
});

test('rejects unauthenticated, expired and malformed-token requests before querying bills', async () => {
  claims = undefined;
  assert.equal((await GET(request())).status, 401);
  claims = { sub: USER_A, role: 'authenticated', user_role: 'tenant' };
  authError = new Error('expired');
  assert.equal((await GET(request())).status, 401);
  authError = null;
  const malformed = new Request('http://localhost/api/tenant/bills', { headers: { Authorization: 'Basic invalid' } });
  assert.equal((await GET(malformed)).status, 401);
  assert.equal(queries.length, 0);
});

test('rejects admins and public/unsupported roles before querying bills', async () => {
  claims.user_role = 'admin';
  assert.equal((await GET(request())).status, 403);
  claims.user_role = 'unknown';
  assert.equal((await GET(request())).status, 401);
  claims.role = 'anon';
  claims.user_role = 'tenant';
  assert.equal((await GET(request())).status, 401);
  assert.equal(queries.length, 0);
});

test('does not disclose database errors or turn failures into an empty history', async () => {
  failQuery = true;
  const response = await GET(request());
  assert.equal(response.status, 500);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.deepEqual(await response.json(), { error: 'Failed to load billing history.' });
});
