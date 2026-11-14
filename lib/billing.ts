import "server-only";

import {and, eq, sql} from "drizzle-orm";
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

// tenant current room
const currentRoomNumber = sql<string | null>`(
    select ${rooms.roomNumber}
    from ${tenantRoomAssignment}
    join ${rooms} on ${rooms.roomId} = ${tenantRoomAssignment.roomId}
    where ${tenantRoomAssignment.tenantId} = ${bills.tenantId} and $    {tenantRoomAssignment.status} = 'active'
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
		.where(eq(tenants.tenantId, tenantId))
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

	const [bill] = await db
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

	return bill;
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
