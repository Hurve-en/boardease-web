/* eslint-disable @typescript-eslint/no-require-imports -- Test real server modules with mocked database/auth boundaries. */
const assert = require('node:assert/strict');
const {test, beforeEach} = require('node:test');
const Module = require('node:module');
const {drizzle} = require('drizzle-orm/pg-proxy');
const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
let rows, claims, queries, fail;
const db = drizzle(async(sql, params) => {
  queries.push({sql,params});
  if (fail) throw new Error('Sensitive database error');
  return {rows};
});
const originalLoad = Module._load;
const dbPath = require.resolve('../db');
const authPath = require.resolve('../lib/supabase/server');
const rolePath = require.resolve('../lib/tenant-info');
Module._load = function(id,parent,isMain) {
  if (id === 'server-only') return {};
  const resolved = Module._resolveFilename(id,parent);
  if (resolved === dbPath) return {db};
  if (resolved === rolePath) return {getUserRole:async()=>claims?.user_role};
  if (resolved === authPath) return {createClient:async()=>({auth:{getUser:async()=>({data:{user:claims ? {id:claims.sub,email:claims.email} : null},error:null})}})};
  return originalLoad.call(this,id,parent,isMain);
};
let GET;
try { ({GET} = require('../app/api/tenant/account/route')); }
finally { Module._load = originalLoad; }
const request = () => new Request(`http://localhost/api/tenant/account?userId=${OTHER}&tenantId=${OTHER}`, {headers:{Authorization:'Bearer mock-token'}});
beforeEach(()=> {
  rows = [['Maya Santos','maya@example.test',OTHER,'101']];
  claims = {sub:USER,email:'maya@example.test',role:'authenticated',user_role:'tenant'};
  queries=[]; fail=false;
});
test('account is scoped to authenticated identity and selects only its active room', async()=> {
  const response=await GET(request());
  assert.equal(response.status,200);
  assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  assert.deepEqual(await response.json(), {profile:{name:'Maya Santos',email:'maya@example.test'},tenancy:{roomNumber:'101',boardingHouseName:null},owner:null});
  assert.match(queries[0].sql,/where "profiles"\."id" = \$/);
  assert.ok(queries[0].params.includes(USER));
  assert.ok(!queries[0].params.includes(OTHER));
  assert.match(queries[0].sql,/"tenant_room_assignment"\."tenant_id" = "tenants"\."tenant_id"/);
  assert.ok(queries[0].params.includes('active'));
});
test('unlinked account can still see its profile without invented tenancy or owner', async()=> {
  rows=[['Maya Santos','maya@example.test',null,null]];
  assert.deepEqual(await (await GET(request())).json(),{profile:{name:'Maya Santos',email:'maya@example.test'},tenancy:null,owner:null});
});
test('rejects missing authentication and non-tenant roles before querying', async()=> {
  claims=undefined;
  assert.equal((await GET(request())).status,401);
  claims={sub:USER,role:'authenticated',user_role:'admin'};
  assert.equal((await GET(request())).status,403);
  assert.equal(queries.length,0);
});
test('missing profile is distinct from database failure and does not expose internal errors', async()=> {
  rows=[];
  assert.equal((await GET(request())).status,404);
  fail=true;
  const response=await GET(request());
  assert.equal(response.status,500);
  assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  assert.deepEqual(await response.json(),{error:'Failed to load account information.'});
});
