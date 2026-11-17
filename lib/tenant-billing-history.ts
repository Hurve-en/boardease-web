import "server-only";

import {and, desc, eq, gt, max, sql} from "drizzle-orm";
import {db} from "@/db";
import {bills, payments, rooms, tenantRoomAssignment, tenants} from "@/db/schema";

// Build correlated subqueries with the query builder so table qualifiers are
// preserved when Drizzle renders the outer single-table selection.
const currentRoom = db
  .select({roomNumber: rooms.roomNumber})
  .from(tenantRoomAssignment)
  .innerJoin(rooms, eq(rooms.roomId, tenantRoomAssignment.roomId))
  .where(and(
    eq(tenantRoomAssignment.tenantId, tenants.tenantId),
    eq(tenantRoomAssignment.status, "active"),
  ))
  .orderBy(desc(tenantRoomAssignment.startDate), desc(tenantRoomAssignment.assignmentId))
  .limit(1);

const lastPaymentDate = db
  .select({date: max(payments.paymentDate)})
  .from(payments)
  .where(and(eq(payments.billId, bills.billId), gt(payments.amount, "0")));

// Partial/unpaid bills have no settlement date. Zero-value records do not
// move the settlement date of a paid bill; bills without payments return null.
const settledDate = sql<string | null>`case when ${bills.status} = 'paid'
  then (${lastPaymentDate})::text else null end`;

export async function getTenantBillingHistory(userId: string) {
  const [tenant] = await db
    .select({
      tenantId: tenants.tenantId,
      name: sql<string>`${tenants.firstName} || ' ' || ${tenants.lastName}`,
      roomNumber: sql<string | null>`(${currentRoom})`,
    })
    .from(tenants)
    .where(eq(tenants.userId, userId))
    .limit(1);

  if (!tenant) return null;

  const history = await db
    .select({
      billId: bills.billId,
      billingMonth: bills.billingMonth,
      totalAmount: bills.totalAmount,
      electricCharge: bills.electricCharge,
      waterCharge: bills.waterCharge,
      outstandingBalance: bills.outstandingBalance,
      dueDate: bills.dueDate,
      settledDate,
      status: bills.status,
    })
    .from(bills)
    .where(eq(bills.tenantId, tenant.tenantId))
    .orderBy(desc(bills.billingMonth));

  return {
    tenant: {
      name: tenant.name,
      // The current schema has no boarding-house-name field.
      boardingHouseName: null,
      roomNumber: tenant.roomNumber,
    },
    bills: history,
  };
}
