# Tenant billing history API

`GET /api/tenant/bills` returns the signed-in tenant's complete billing history for the mobile History screen. It uses the existing `authorize(request, ["tenant"])` authentication helper and accepts the mobile app's Bearer access token (or the existing web cookie session).

The user identity comes from verified authentication claims. The query resolves `tenants.user_id` from that identity, then filters bills by the resolved `tenant_id`. Client-supplied `tenantId` or `userId` query parameters cannot change that scope. Admin-only `/api/bills` behavior is unchanged.

## Response

```json
{
  "tenant": {
    "name": "Maya Santos",
    "boardingHouseName": null,
    "roomNumber": "101"
  },
  "bills": [
    {
      "billId": "<bill UUID>",
      "billingMonth": "2026-10-01",
      "totalAmount": "5350.00",
      "electricCharge": "600.00",
      "waterCharge": "250.00",
      "outstandingBalance": "2350.00",
      "dueDate": "2026-10-10",
      "settledDate": null,
      "status": "partial"
    }
  ]
}
```

- All bills are returned newest month first, without pagination or implicit current-month filtering. The mobile app derives available years, status filters, and latest-three-bill utility charts from this complete history.
- Decimal amounts remain strings, preserving the existing database representation. Dates are calendar dates in `YYYY-MM-DD`; status is `paid`, `partial`, or `unpaid` from the existing bill record.
- The room comes from the latest active assignment (matching existing backend assignment semantics), or is null when no active assignment exists. A correlated subquery prevents multiple assignments from duplicating bills.
- `boardingHouseName` is null because the current schema has no boarding-house-name field. No sample house name is fabricated.
- A paid bill's settlement date is the latest positive recorded payment date for that bill, or null when no positive payment exists. Partial/unpaid bills always return null. This represents the current payment records, not an audit history of past status changes.
- Responses include `Cache-Control: private, no-store`.

## Errors and empty states

| Status | Meaning |
| --- | --- |
| 200 with `bills: []` | The account has a linked tenant record but no bills yet. |
| 401 | Missing, malformed, expired, or otherwise invalid authentication. |
| 403 | The authenticated role is not tenant. |
| 403 with `code: "TENANT_NOT_LINKED"` | The account is not yet linked through `tenants.user_id`; the owner must link it. |
| 500 | Billing history could not be read; database details are not exposed. |

A fresh sign-up alone does not create the admin-managed tenant record or historical bills. This endpoint does not create tenants, assignments, bills, payments, or schema changes. No database migration is required.

## Verification

```bash
node --import tsx --test tests/tenant-billing-history.test.cjs
npm run lint
npx tsc --noEmit
```

The focused tests exercise the real route, authorization helper, and Drizzle query generation while mocking Supabase claims and database execution. They cover user/tenant scoping despite spoofed query IDs, complete response fields, empty histories, missing linkage, authentication/role rejection, no-store headers, and non-disclosing failures. They do not validate live credentials, deployed database contents, or execute the generated SQL against PostgreSQL. Run a signed-in device smoke check against the web server before release.
