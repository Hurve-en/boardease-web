import "server-only";

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

// Placeholder until the billing (BE-70) and tenant (BE-71) queries are ready.
export async function getDashboardData(): Promise<DashboardData> {
	return {
		rooms: {total: 0, occupied: 0, unoccupied: 0},
		tenants: {total: 0, active: 0},
		billing: {
			month: currentBillingMonth(),
			totalBilled: "0.00",
			totalCollected: "0.00",
			totalOutstanding: "0.00",
			paidCount: 0,
			partialCount: 0,
			unpaidCount: 0,
		},
		overdue: {count: 0, amount: "0.00"},
		recentPayments: [],
	};
}
