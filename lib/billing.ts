import "server-only";
import { randomUUID } from "node:crypto";
import { notifyTenant } from "./notifications";
import { sendPushForNotice } from "./push";

import {and, eq, isNull, sql} from "drizzle-orm";
import {db} from "@/db";
import {
	bills,
	payments,
	profiles,
	rooms,
	tenantRoomAssignment,
	tenants,
} from "@/db/schema";
import {calculateTotal} from "@/lib/bill-math";
import type {UpdateBillInput} from "@/lib/definitions";

// tenant current room
const currentRoomNumber = sql<string | null>`(
    select ${rooms.roomNumber}
    from ${tenantRoomAssignment}
    join ${rooms} on ${rooms.roomId} = ${tenantRoomAssignment.roomId}
    where ${tenantRoomAssignment.tenantId} = ${bills.tenantId} and ${tenantRoomAssignment.status} = 'active'
    order by ${tenantRoomAssignment.startDate} desc 
    limit 1
)`;

// tenants with active room
export async function getBillableTenants() {
	return db
		.select({
			tenantId: tenants.tenantId,
			name: sql<string>`${tenants.firstName} || ' ' || ${tenants.lastName}`,
			roomNumber: rooms.roomNumber,
			monthlyRent: rooms.monthlyRent,
		})
		.from(tenants)
		.innerJoin(
			tenantRoomAssignment,
			and(
				eq(tenantRoomAssignment.tenantId, tenants.tenantId),
				eq(tenantRoomAssignment.status, "active"),
			),
		)
		.innerJoin(rooms, eq(rooms.roomId, tenantRoomAssignment.roomId))
		.where(isNull(tenants.archivedAt))
		.orderBy(tenants.firstName);
}

export async function getTenantRent(tenantId: string) {
	const [tenant] = await db
		.select({
			tenantId: tenants.tenantId,
			monthlyRent: rooms.monthlyRent,
		})
		.from(tenants)
		.leftJoin(
			tenantRoomAssignment,
			and(
				eq(tenantRoomAssignment.tenantId, tenants.tenantId),
				eq(tenantRoomAssignment.status, "active"),
			),
		)
		.leftJoin(rooms, eq(rooms.roomId, tenantRoomAssignment.roomId))
		.where(and(eq(tenants.tenantId, tenantId), isNull(tenants.archivedAt)))
		.limit(1);

	return tenant;
}

export type NewBill = {
	tenantId: string;
	billingMonth: string; // "2026-11-01"
	dueDate: string; // "2026-11-10"
	rentAmount: number;
	electricCharge: number;
	waterCharge: number;
};

export async function createBill(input: NewBill) {
	const total = calculateTotal(
		input.rentAmount,
		input.electricCharge,
		input.waterCharge,
	);

	const { bill, notice } = await db.transaction(async tx => {
		const [bill] = await tx
			.insert(bills)
			.values({
				tenantId: input.tenantId,
				billingMonth: input.billingMonth,
				dueDate: input.dueDate,
				rentAmount: input.rentAmount.toFixed(2),
				electricCharge: input.electricCharge.toFixed(2),
				waterCharge: input.waterCharge.toFixed(2),
				totalAmount: total,
				outstandingBalance: total,
			})
			.returning();

		const notice = await notifyTenant(tx, bill.tenantId, {
			kind: "bill_issued", eventKey: `bill:${bill.billId}`, billId: bill.billId,
			title: "New monthly bill", body: `${bill.billingMonth.slice(0, 7)} · ₱${total} due ${bill.dueDate}`,
		});
		return { bill, notice };
	});

	// Send the push only after the transaction has committed
	if (notice) await sendPushForNotice(notice);

	return bill;
}

export async function getBillsForMonth(billingMonth: string) {
	const [list, [totals], [collected]] = await Promise.all([
		db
			.select({
				billId: bills.billId,
				tenantName: sql<string>`${tenants.firstName} || ' ' || ${tenants.lastName}`,
				roomNumber: currentRoomNumber,
				billingMonth: bills.billingMonth,
				totalAmount: bills.totalAmount,
				outstandingBalance: bills.outstandingBalance,
				dueDate: bills.dueDate,
				status: bills.status,
			})
			.from(bills)
			.innerJoin(tenants, eq(tenants.tenantId, bills.tenantId))
			.where(eq(bills.billingMonth, billingMonth))
			.orderBy(bills.dueDate, tenants.firstName),
		db
			.select({
				totalBilled: sql<string>`coalesce(sum(${bills.totalAmount}), 0)`,
				totalOutstanding: sql<string>`coalesce(sum(${bills.outstandingBalance}), 0)`,
			})
			.from(bills)
			.where(eq(bills.billingMonth, billingMonth)),
		db
			.select({value: sql<string>`coalesce(sum(${payments.amount}), 0)`})
			.from(payments)
			.innerJoin(bills, eq(bills.billId, payments.billId))
			.where(eq(bills.billingMonth, billingMonth)),
	]);

	return {
		summary: {
			totalBilled: totals?.totalBilled ?? "0",
			totalCollected: collected?.value ?? "0",
			totalOutstanding: totals?.totalOutstanding ?? "0",
		},
		bills: list,
	};
}

export async function getBillsForTenant(userId: string, billingMonth: string) {
	return db
		.select({
			id: bills.billId,
			name: sql<string>`${tenants.firstName} || ' ' || ${tenants.lastName}`,
			amount: bills.totalAmount,
			dueDate: bills.dueDate,
			status: bills.status,
			outstandingBalance: bills.outstandingBalance,
		})
		.from(bills)
		.innerJoin(tenants, eq(tenants.tenantId, bills.tenantId))
		.where(
			and(eq(tenants.userId, userId), eq(bills.billingMonth, billingMonth), isNull(tenants.archivedAt)),
		)
		.orderBy(bills.dueDate);
}

export async function getBillDetails(billId: string) {
	const [bill] = await db
		.select({
			billId: bills.billId,
			billingMonth: bills.billingMonth,
			dueDate: bills.dueDate,
			createdAt: bills.createdAt,
			rentAmount: bills.rentAmount,
			electricCharge: bills.electricCharge,
			waterCharge: bills.waterCharge,
			totalAmount: bills.totalAmount,
			outstandingBalance: bills.outstandingBalance,
			status: bills.status,
			tenantName: sql<string>`${tenants.firstName} || ' ' || ${tenants.lastName}`,
			roomNumber: currentRoomNumber,
		})
		.from(bills)
		.innerJoin(tenants, eq(tenants.tenantId, bills.tenantId))
		.where(eq(bills.billId, billId))
		.limit(1);

	if (!bill) return undefined;

	const billPayments = await db
		.select({
			paymentId: payments.paymentId,
			amount: payments.amount,
			paymentDate: payments.paymentDate,
			createdAt: payments.createdAt,
			recordedBy: profiles.name,
		})
		.from(payments)
		.innerJoin(profiles, eq(profiles.id, payments.recordedBy))
		.where(eq(payments.billId, billId))
		.orderBy(payments.paymentDate, payments.createdAt);

	return {bill, payments: billPayments};
}

export async function updateBill(billId: string, input: UpdateBillInput) {
	const outcome = await db.transaction(async (tx) => {
		const [bill] = await tx
			.select({billingMonth: bills.billingMonth, total: bills.totalAmount, dueDate: bills.dueDate})
			.from(bills)
			.where(eq(bills.billId, billId))
			.for("update");
		if (!bill) return {result: "not-found"} as const;
		if (input.dueDate < bill.billingMonth)
			return {result: "due-before-month"} as const;

		const [sum] = await tx
			.select({paid: sql<string>`coalesce(sum(${payments.amount}), 0)`})
			.from(payments)
			.where(eq(payments.billId, billId));

		const total = calculateTotal(
			input.rentAmount,
			input.electricCharge,
			input.waterCharge,
		);
		const totalCents = Math.round(Number(total) * 100);
		const paidCents = Math.round(Number(sum?.paid ?? 0) * 100);
		if (totalCents < paidCents)
			return {
				result: "below-paid",
				paid: (paidCents / 100).toFixed(2),
			} as const;

		const balanceCents = totalCents - paidCents;
		const status =
			balanceCents === 0 ? "paid" : paidCents > 0 ? "partial" : "unpaid";

		const [updated] = await tx
			.update(bills)
			.set({
				dueDate: input.dueDate,
				rentAmount: input.rentAmount.toFixed(2),
				electricCharge: input.electricCharge.toFixed(2),
				waterCharge: input.waterCharge.toFixed(2),
				totalAmount: total,
				outstandingBalance: (balanceCents / 100).toFixed(2),
				status,
			})
			.where(eq(bills.billId, billId))
			.returning();

		const changes = [];
		if (bill.total !== updated.totalAmount) changes.push(`Amount changed from ₱${bill.total} to ₱${updated.totalAmount}.`);
		if (bill.dueDate !== updated.dueDate) changes.push(`Due date changed from ${bill.dueDate} to ${updated.dueDate}.`);
		const notice = changes.length
			? await notifyTenant(tx, updated.tenantId, {
				kind: "bill_revised", eventKey: randomUUID(), billId,
				title: `${bill.billingMonth.slice(0, 7)} bill revised`, body: changes.join(" "),
			})
			: null;

		return {result: "updated", bill: updated, notice} as const;
	});

	if (outcome.result !== "updated") return outcome;

	// Send the push only after the transaction has committed
	if (outcome.notice) await sendPushForNotice(outcome.notice);

	return {result: "updated", bill: outcome.bill} as const;
}