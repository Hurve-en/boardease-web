import "server-only";
import { and, count, desc, eq, exists, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { bills, notifications, tenants } from "@/db/schema";
import type { CurrentUser } from "@/lib/auth";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Notice = Pick<typeof notifications.$inferInsert, "kind" | "title" | "body" | "eventKey" | "billId">;

export async function notifyTenant(tx: Transaction, tenantId: string, notice: Notice) {
  const [tenant] = await tx.select({ recipientId: tenants.userId }).from(tenants)
    .where(and(eq(tenants.tenantId, tenantId), isNull(tenants.archivedAt)));
  if (tenant) await tx.insert(notifications).values({ ...notice, ...tenant, role: "tenant" });
}

export function inboxScope(user: CurrentUser) {
  const activeTenant = db.select({ id: tenants.tenantId }).from(tenants)
    .where(and(eq(tenants.userId, user.id), isNull(tenants.archivedAt)));
  return and(
    eq(notifications.recipientId, user.id),
    eq(notifications.role, user.role),
    user.role === "tenant" ? exists(activeTenant) : undefined,
  );
}

export async function listNotifications(user: CurrentUser, before?: number) {
  const scope = inboxScope(user);
  const [rows, [total]] = await Promise.all([
    db.select({
      id: notifications.id, kind: notifications.kind, billId: notifications.billId,
      billingMonth: bills.billingMonth, title: notifications.title, body: notifications.body, eventKey: notifications.eventKey,
      createdAt: notifications.createdAt, readAt: notifications.readAt,
    }).from(notifications).innerJoin(bills, eq(bills.billId, notifications.billId)).where(and(scope, before ? lt(notifications.id, before) : undefined))
      .orderBy(desc(notifications.id)).limit(26),
    db.select({ value: count() }).from(notifications).innerJoin(bills, eq(bills.billId, notifications.billId)).where(and(scope, isNull(notifications.readAt))),
  ]);
  const items = rows.slice(0, 25);
  return { items, unread: total.value, next: rows.length > 25 ? items[24].id : null };
}
