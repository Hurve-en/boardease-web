import "server-only";

import {and, eq, gt, lt, sql} from "drizzle-orm";
import {db} from "@/db";
import {bills, payments, tenants} from "@/db/schema";

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
	const [billing, overdue, recentPayments] = await Promise.all([
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
			.where(and(lt(bills.dueDate, today), gt(bills.outstandingBalance, "0"))),
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
	]);

	const [summary] = billing;
	const [overdueSummary] = overdue;
	const totalCollected = await db
		.select({
			value: sql<string>`coalesce(sum(${payments.amount}), 0)`,
		})
		.from(payments)
		.innerJoin(bills, eq(payments.billId, bills.billId))
		.where(eq(bills.billingMonth, month));

	return {
		rooms: {total: 0, occupied: 0, unoccupied: 0},
		tenants: {total: 0, active: 0},
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
	};
}
