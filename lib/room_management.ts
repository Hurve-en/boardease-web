import "server-only";

import {and, eq, gte, lte, or, isNull} from "drizzle-orm";
import {db} from "@/db";
import {
	rooms,
	bills,
	tenants,
	profiles,
	tenantRoomAssignment,
} from "@/db/schema";

export type RoomDetails = {
  room: {
    roomId: string;
    roomNumber: string;
    monthlyRent: number;
    status: string;
  };

  tenant: {
    tenantId: string;
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
    startDate: string;
  } | null;

  currentBill: {
    billId: string;
    billingMonth: string;
    totalAmount: number;
    outstandingBalance: number;
    status: string;
    dueDate: string;
  } | null;
};

export function CurrentMonthlyBill(now = new Date()): string {
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



export async function getRoomDetails(roomId: string): Promise<RoomDetails | null> {
	const month = CurrentMonthlyBill();
	const today = currentDate();

	const [row] = await db
		.select({
			roomId: rooms.roomId,
			roomNumber: rooms.roomNumber,
			monthlyRent: rooms.monthlyRent,
			roomStatus: rooms.status,
			tenantId: tenants.tenantId,
			firstName: tenants.firstName,
			lastName: tenants.lastName,
			email: profiles.email,
			contactNumber: tenants.contactNumber,
			startDate: tenantRoomAssignment.startDate,
			billId: bills.billId,
			billingMonth: bills.billingMonth,
			totalAmount: bills.totalAmount,
			outstandingBalance: bills.outstandingBalance,
			billStatus: bills.status,
			dueDate: bills.dueDate,
		})
		.from(rooms)
		.leftJoin(
			tenantRoomAssignment,
			and(
				eq(tenantRoomAssignment.roomId, rooms.roomId),
				eq(tenantRoomAssignment.status, "active"),
				lte(tenantRoomAssignment.startDate, today),
				or(
					isNull(tenantRoomAssignment.endDate),
					gte(tenantRoomAssignment.endDate, today),
				),
			),
		)
		.leftJoin(tenants, eq(tenants.tenantId, tenantRoomAssignment.tenantId))
		.leftJoin(profiles, eq(profiles.id, tenants.userId))
		.leftJoin(
			bills,
			and(
				eq(bills.tenantId, tenants.tenantId),
				eq(bills.billingMonth, month),
			),
		)
		.where(eq(rooms.roomId, roomId))
		.limit(1);

	if (!row) return null;

	return {
		room: {
			roomId: row.roomId,
			roomNumber: row.roomNumber,
			monthlyRent: Number(row.monthlyRent),
			status: row.roomStatus,
		},
		tenant: row.tenantId
			? {
					tenantId: row.tenantId,
					firstName: row.firstName!,
					lastName: row.lastName!,
					email: row.email!,
					contactNumber: row.contactNumber!,
					startDate: row.startDate!,
				}
			: null,
		currentBill: row.billId
			? {
					billId: row.billId,
					billingMonth: row.billingMonth!,
					totalAmount: Number(row.totalAmount),
					outstandingBalance: Number(row.outstandingBalance),
					status: row.billStatus!,
					dueDate: row.dueDate!,
				}
			: null,
	};
}
