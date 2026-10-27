import "server-only";

import {getRoomSummary} from "@/lib/room";

import {and, eq, gt, lt, sql} from "drizzle-orm";
import {db} from "@/db";
import {
	rooms,
	bills,
	payments,
	tenantRoomAssignment,
	tenants,
} from "@/db/schema";

export type DashboardData = {
	rooms: {
		total: number;
		occupied: number;
		unoccupied: number;
	};
	tenants: {
		total: number;
		active: number;
	};
	billing: {
		month: string; // first day of the current month
		totalBilled: string;
		totalCollected: string; // sum of payments toward this month's bills
		totalOutstanding: string;
		paidCount: number;
		partialCount: number;
		unpaidCount: number;
	};
	overdue: {
		count: number;
		amount: string;
	};
	recentPayments: {
		paymentId: string;
		tenantName: string;
		amount: string;
		paymentDate: string;
		billingMonth: string;
	}[];
	ledger: {
		billId: string;
		tenantName: string;
		roomNumber: string | null;
		totalAmount: string;
		outstandingBalance: string;
		status: "paid" | "partial" | "unpaid";
	}[];
};

export function currentBillingMonth(now = new Date()): string {
	const [year, month] = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Manila",
		year: "numeric",
		month: "2-digit",
	})
		.format(now)
		.split("-");

	return `${year}-${month}-01`;
}

function currentDate(now = new Date()): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Manila",
	}).format(now);
}

export async function getDashboardData(): Promise<DashboardData> {
	const month = currentBillingMonth();
	const today = currentDate();
	const [roomSummary, billing, overdue, recentPayments, tenantSummary, ledger] =
		await Promise.all([
			getRoomSummary(),

			db
				.select({
					totalBilled: sql<string>`coalesce(sum(${bills.totalAmount}), 0)`,
					totalOutstanding: sql<string>`coalesce(sum(${bills.outstandingBalance}), 0)`,
					paidCount: sql<number>`count(*) filter (where ${bills.status} = 'paid')`,
					partialCount: sql<number>`count(*) filter (where ${bills.status} = 'partial')`,
					unpaidCount: sql<number>`count(*) filter (where ${bills.status} = 'unpaid')`,
				})
				.from(bills)
				.where(eq(bills.billingMonth, month)),
			db
				.select({
					count: sql<number>`count(*)`,
					amount: sql<string>`coalesce(sum(${bills.outstandingBalance}), 0)`,
				})
				.from(bills)
				.where(
					and(lt(bills.dueDate, today), gt(bills.outstandingBalance, "0")),
				),
			db
				.select({
					paymentId: payments.paymentId,
					tenantName: sql<string>`${tenants.firstName} || ' ' || ${tenants.lastName}`,
					amount: payments.amount,
					paymentDate: payments.paymentDate,
					billingMonth: bills.billingMonth,
				})
				.from(payments)
				.innerJoin(bills, eq(payments.billId, bills.billId))
				.innerJoin(tenants, eq(bills.tenantId, tenants.tenantId))
				.orderBy(sql`${payments.createdAt} desc`)
				.limit(5),
			db
				.select({
					total: sql<number>`count(*)`,
					active: sql<number>`count(distinct ${tenantRoomAssignment.tenantId})`,
				})
				.from(tenants)
				.leftJoin(
					tenantRoomAssignment,
					and(
						eq(tenants.tenantId, tenantRoomAssignment.tenantId),
						eq(tenantRoomAssignment.status, "active"),
					),
				),

			db
				.select({
					billId: bills.billId,
					tenantName: sql<string>`${tenants.firstName} || ' ' || ${tenants.lastName}`,
					roomNumber: rooms.roomNumber,
					totalAmount: bills.totalAmount,
					outstandingBalance: bills.outstandingBalance,
					status: bills.status,
				})
				.from(bills)
				.innerJoin(tenants, eq(bills.tenantId, tenants.tenantId))
				.leftJoin(
					tenantRoomAssignment,
					and(
						eq(tenants.tenantId, tenantRoomAssignment.tenantId),
						eq(tenantRoomAssignment.status, "active"),
					),
				)
				.leftJoin(rooms, eq(tenantRoomAssignment.roomId, rooms.roomId))
				.where(eq(bills.billingMonth, month))
				.orderBy(bills.dueDate),
		]);

	const [summary] = billing;
	const [overdueSummary] = overdue;
	const [tenantCounts] = tenantSummary;
	const totalCollected = await db
		.select({
			value: sql<string>`coalesce(sum(${payments.amount}), 0)`,
		})
		.from(payments)
		.innerJoin(bills, eq(payments.billId, bills.billId))
		.where(eq(bills.billingMonth, month));

	return {
		rooms: roomSummary,

		tenants: {
			total: Number(tenantCounts?.total ?? 0),
			active: Number(tenantCounts?.active ?? 0),
		},

		billing: {
			month,
			totalBilled: summary?.totalBilled ?? "0",
			totalCollected: totalCollected[0]?.value ?? "0",
			totalOutstanding: summary?.totalOutstanding ?? "0",
			paidCount: Number(summary?.paidCount ?? 0),
			partialCount: Number(summary?.partialCount ?? 0),
			unpaidCount: Number(summary?.unpaidCount ?? 0),
		},
		overdue: {
			count: Number(overdueSummary?.count ?? 0),
			amount: overdueSummary?.amount ?? "0",
		},
		recentPayments,
		ledger,
	};
}
