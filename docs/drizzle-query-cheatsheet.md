# BoardEase Drizzle query cheatsheet

This guide uses the current schema in `db/schema.ts` and existing query style in `lib/`. The schema is the current source of truth; the old ERD is outdated.

## 1. Table and column names

Drizzle separates the TypeScript name from the PostgreSQL name:

```ts
export const rooms = pgTable("rooms", {
  roomId: uuid("room_id").primaryKey().defaultRandom(),
  roomNumber: text("room_number").notNull(),
  monthlyRent: numeric("monthly_rent", { precision: 10, scale: 2 }).notNull(),
});
```

| TypeScript name used in app code | SQL name in PostgreSQL |
| --- | --- |
| `rooms` | table `rooms` |
| `rooms.roomId` | column `rooms.room_id` |
| `rooms.roomNumber` | column `rooms.room_number` |
| `rooms.monthlyRent` | column `rooms.monthly_rent` |

Use the exported table and camelCase property in code. Drizzle maps it to the SQL name. Current table exports include `profiles`, `tenants`, `boardingHouses`, `rooms`, `tenantRoomAssignment`, `bills`, `payments`, and `paymentSubmissions`.

## 2. Imports and UUIDs

```ts
import "server-only";
import { and, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { bills, rooms, tenants } from "@/db/schema";
```

Query code belongs in server-side `lib/` modules. The `server-only` import helps prevent database code from entering the browser bundle.

UUID values are strings in TypeScript. `uuid("room_id")` does **not** mean a JavaScript number:

```ts
const roomId: string = "94b1c374-68f0-4d9f-a879-426d0118e090";

const [room] = await db
  .select({ roomId: rooms.roomId, roomNumber: rooms.roomNumber })
  .from(rooms)
  .where(eq(rooms.roomId, roomId))
  .limit(1);
```

Do not use `Number(roomId)` or `parseInt(roomId)`; that corrupts the UUID. Validate incoming IDs at the request/action boundary, then keep them as strings.

## 3. What `eq` means

`eq` means SQL `=`. Pass a typed Drizzle column first and a value of the matching type second:

```ts
eq(rooms.roomId, roomId)        // rooms.room_id = $1
eq(rooms.roomNumber, "101")     // rooms.room_number = $1
eq(bills.status, "unpaid")      // bills.status = $1
```

Use `eq(rooms.roomId, roomId)`, not `eq("room_id", roomId)`. Drizzle needs the column object to infer the type and build the right SQL.

## 4. Select one row or many

Drizzle queries return arrays. For a single expected result, take the first row and handle the missing case:

```ts
const [tenant] = await db
  .select({
    tenantId: tenants.tenantId,
    firstName: tenants.firstName,
    lastName: tenants.lastName,
  })
  .from(tenants)
  .where(eq(tenants.tenantId, tenantId))
  .limit(1);

if (!tenant) return null;
```

For multiple results, keep the array:

```ts
const tenantRows = await db
  .select({
    tenantId: tenants.tenantId,
    firstName: tenants.firstName,
    lastName: tenants.lastName,
  })
  .from(tenants)
  .orderBy(tenants.lastName, tenants.firstName);
```

The keys in `.select({ ... })` name the returned JavaScript properties:

```ts
.select({
  id: rooms.roomId,
  identifier: rooms.roomNumber,
  rent: rooms.monthlyRent,
})
```

The result uses `row.id`, `row.identifier`, and `row.rent`. These are aliases chosen by you; they do not rename database columns.

## 5. Filters and combining conditions

Common helpers imported from `drizzle-orm`:

| Helper | SQL meaning | Example |
| --- | --- | --- |
| `eq(a, b)` | equals | `eq(bills.status, "paid")` |
| `ne(a, b)` | not equal | `ne(rooms.status, "occupied")` |
| `gt` / `gte` | greater than / at least | `gt(bills.outstandingBalance, "0")` |
| `lt` / `lte` | less than / at most | `lt(bills.dueDate, today)` |
| `inArray(col, values)` | `IN (...)` | `inArray(payments.billId, billIds)` |
| `isNull(col)` | `IS NULL` | `isNull(tenantRoomAssignment.endDate)` |
| `and(...)` | all conditions | `and(eq(...), eq(...))` |
| `or(...)` | any condition | `or(isNull(...), gte(...))` |

Example: only bills for a particular tenant and month:

```ts
const tenantBills = await db
  .select({ billId: bills.billId, amount: bills.totalAmount })
  .from(bills)
  .where(and(
    eq(bills.tenantId, tenantId),
    eq(bills.billingMonth, billingMonth),
  ));
```

BoardEase uses PostgreSQL `numeric()` for money and `date()` for dates. These commonly arrive in TypeScript as strings. `integer()` columns are numbers. Use the types inferred from the schema; don’t convert amounts or UUIDs just to silence a type error.

## 6. Joins

Join using the foreign-key relationship in `db/schema.ts`. An inner join drops rows without a match; a left join keeps the left row and makes the joined fields nullable.

```ts
const rows = await db
  .select({
    billId: bills.billId,
    tenantFirstName: tenants.firstName,
    tenantLastName: tenants.lastName,
    totalAmount: bills.totalAmount,
  })
  .from(bills)
  .innerJoin(tenants, eq(tenants.tenantId, bills.tenantId));
```

```ts
const rows = await db
  .select({
    roomId: rooms.roomId,
    roomNumber: rooms.roomNumber,
    boardingHouseName: boardingHouses.name,
  })
  .from(rooms)
  .leftJoin(boardingHouses, eq(rooms.boardingHouseId, boardingHouses.id));
```

In the second query, `boardingHouseName` can be `null`. Reflect that in the return type and display a missing-data state. Existing join examples are in `lib/billing.ts`, `lib/room.ts`, and `lib/tenant-billing-history.ts`.

## 7. Insert, update, and delete

### Insert

Object keys use TypeScript property names:

```ts
const [created] = await db
  .insert(rooms)
  .values({
    roomNumber: "101",
    monthlyRent: "4500.00",
    maxOccupancy: 2,
  })
  .returning({ roomId: rooms.roomId });
```

Database-default fields can be omitted. For example, a UUID with `.defaultRandom()` is created by the database.

### Update

Use `.set()` for new values and `.where()` to select the row. Include a `where` condition when changing a specific record:

```ts
const [updated] = await db
  .update(rooms)
  .set({ monthlyRent: "4800.00" })
  .where(eq(rooms.roomId, roomId))
  .returning({ roomId: rooms.roomId, monthlyRent: rooms.monthlyRent });

if (!updated) return { success: false, error: "Room not found." };
```

### Delete

```ts
const [deleted] = await db
  .delete(rooms)
  .where(eq(rooms.roomId, roomId))
  .returning({ roomId: rooms.roomId });

if (!deleted) return { success: false, error: "Room not found." };
```

Use `.returning()` to tell whether a row was actually changed/deleted. Foreign keys can block deletion; catch the database error and report failure rather than claiming success. Check each reference's `onDelete` setting before expecting dependent records to cascade.

## 8. What “name” refers to in a result

Keep these three names separate:

1. Schema property, such as `tenants.firstName`.
2. SQL column, such as `first_name`.
3. Selected result alias, such as `firstName` or `tenantName`.

Example:

```ts
.select({
  tenantName: tenants.firstName,
})
```

This produces a result property called `tenantName`; access it as `row.tenantName`. If you select a computed field, give it a clear alias as well. The object key controls the TypeScript and JSON-facing name, not the physical database name.

## 9. Why form actions get a FormData type error

An HTML form's `action` receives `FormData`. A database helper like `Remove_Tenant(tenantId: string, tenantName: string)` is not itself a form action. Passing it directly makes the form's `FormData` argument land in the string parameter.

Wrap it in a Next.js Server Action and bind the fixed arguments before the form submission argument:

```ts
// app/tenants/actions.ts
"use server";

export async function removeTenantAction(
  tenantId: string,
  tenantName: string,
  formData: FormData,
) {
  void formData;
  await verifyAdmin();
  const result = await Remove_Tenant(tenantId, tenantName);
  if (!result.success) redirect("/tenants?delete_error=1");
  redirect("/tenants");
}
```

```tsx
<form action={removeTenantAction.bind(null, tenantId, tenantName)}>
  <button type="submit">Delete tenant</button>
</form>
```

The argument order at submission is:

```text
removeTenantAction(tenantId, tenantName, submittedFormData)
```

`onClick` is different: React calls it with a mouse event. Don’t assign a function expecting a string ID directly to `onClick`. In this app, keep database helpers server-only and call them through a verified Server Action.

With React `useActionState`, the action signature instead starts with `(previousState, formData)`. Don’t mix the `useActionState` signature with a plain `<form action={...}>` signature.

## 10. Transactions

Use a transaction when multiple database changes must succeed or fail as one unit:

```ts
await db.transaction(async (tx) => {
  await tx.update(tenantRoomAssignment)
    .set({ status: "inactive" })
    .where(eq(tenantRoomAssignment.tenantId, tenantId));

  await tx.update(rooms)
    .set({ status: "occupied" })
    .where(eq(rooms.roomId, roomId));
});
```

Use the callback's `tx` object for every query that belongs in the transaction. Keep database/business logic in `lib/`; the route or action should handle authentication, authorization, and validating user input.

## Type-error checklist

1. Look up the table export and exact property in `db/schema.ts`.
2. Use a column object such as `rooms.roomId`, not a string like `"room_id"`.
3. Check types: UUID is `string`; `numeric()` is generally `string`; `integer()` is `number`; left-joined or nullable fields can be `null`.
4. Check the selected alias. If the key is `tenantName`, read `row.tenantName`.
5. Check the callback signature: form `action` receives `FormData`; `onClick` receives a mouse event; `useActionState` receives previous state then `FormData`.
6. Check for missing rows before reading their properties.

## References

- [Drizzle select and partial selection](https://orm.drizzle.team/docs/select)
- [Drizzle filter operators](https://orm.drizzle.team/docs/operators)
- [Drizzle joins](https://orm.drizzle.team/docs/joins)
- [Drizzle update](https://orm.drizzle.team/docs/update)
- [Drizzle insert](https://orm.drizzle.team/docs/insert)
- [Drizzle delete](https://orm.drizzle.team/docs/delete)
- [Next.js forms and Server Actions](https://nextjs.org/docs/app/guides/forms)
