

import "server-only";
import {and, eq, gte, lte, or, isNull, sql} from "drizzle-orm";
import {db} from "@/db";
import {
	boardingHouses,
	rooms,
	bills,
	tenants,
	profiles,
	tenantRoomAssignment,
} from "@/db/schema";
import { resolveHouseId, isDuplicateRoomNumber } from "./room";
import { HouseNameSchema } from "./definitions";
import { revalidatePath } from "next/cache";

export type RoomDetails = {
  room: {
    roomId: string;
    roomNumber: string;
    boardingHouseName: string | null;
    monthlyRent: number;
    maxOccupancy: number;
    status: string;
  };
  occupancy: number;

  tenant: {
    tenantId: string;
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
    startDate: string;
    endDate: string;
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
			boardingHouseName: boardingHouses.name,
			monthlyRent: rooms.monthlyRent,
			maxOccupancy: rooms.maxOccupancy,
			roomStatus: rooms.status,
			tenantId: tenants.tenantId,
			firstName: tenants.firstName,
			lastName: tenants.lastName,
			email: profiles.email,
			contactNumber: tenants.contactNumber,
			startDate: tenantRoomAssignment.startDate,
			endDate: tenantRoomAssignment.endDate,
			billId: bills.billId,
			billingMonth: bills.billingMonth,
			totalAmount: bills.totalAmount,
			outstandingBalance: bills.outstandingBalance,
			billStatus: bills.status,
			dueDate: bills.dueDate,
		})
		.from(rooms)
		.leftJoin(boardingHouses, eq(rooms.boardingHouseId, boardingHouses.id))
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

	const [occupancyRow] = await db
		.select({count: sql<number>`count(*)`})
		.from(tenantRoomAssignment)
		.where(and(
			eq(tenantRoomAssignment.roomId, roomId),
			eq(tenantRoomAssignment.status, "active"),
			lte(tenantRoomAssignment.startDate, today),
			gte(tenantRoomAssignment.endDate, today),
		));

	return {
		room: {
			roomId: row.roomId,
			roomNumber: row.roomNumber,
			boardingHouseName: row.boardingHouseName,
			monthlyRent: Number(row.monthlyRent),
			maxOccupancy: Number(row.maxOccupancy),
			status: row.roomStatus,
		},
		occupancy: Number(occupancyRow?.count ?? 0),
		tenant: row.tenantId
			? {
					tenantId: row.tenantId,
					firstName: row.firstName!,
					lastName: row.lastName!,
					email: row.email!,
					contactNumber: row.contactNumber!,
					startDate: row.startDate!,
					endDate: row.endDate!,
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

export async function EndRoomAssignment(roomId: string) {
	const today = currentDate();

	const [assignment] = await db
		.select({
			assignmentId: tenantRoomAssignment.assignmentId,
			startDate: tenantRoomAssignment.startDate,
		})
		.from(tenantRoomAssignment)
		.where(and(
			eq(tenantRoomAssignment.roomId, roomId),
			eq(tenantRoomAssignment.status, "active"),
		))
		.limit(1);

	if (!assignment) {
		throw new Error("No active assignment found for this room.");
	}

	await db.transaction(async (tx) => {
		await tx
			.update(tenantRoomAssignment)
			.set({
				status: "inactive",
				endDate: assignment.startDate < today ? today : assignment.startDate,
			})
			.where(eq(tenantRoomAssignment.assignmentId, assignment.assignmentId));

		await tx
			.update(rooms)
			.set({status: "unoccupied"})
			.where(eq(rooms.roomId, roomId));
	});

	revalidatePath("/tenants");
	revalidatePath("/rooms");
	revalidatePath(`/room_management/${roomId}`);
}


export type UpdateActionState = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function EditRoomDetails(
  _prev: UpdateActionState,
  formData: FormData,
): Promise<UpdateActionState> {

	const roomId = String(formData.get("roomId"));
	const rawName = formData.get("boardingHouseName");
	const house = rawName ? HouseNameSchema.safeParse(rawName) : undefined;
	if (house && !house.success) return {success: false, error: house.error.issues[0].message};
	try {
		await db.transaction(async (tx) => {
			const boardingHouseId = house?.success ? await resolveHouseId(tx, house.data) : undefined;
			const [room] = await tx.update(rooms).set({
				boardingHouseId,
				roomNumber: formData.get("roomName")?.toString(),
				monthlyRent: formData.get("monthlyRent")?.toString(),
				maxOccupancy: Number(formData.get("maxOccupancy")),
			}).where(eq(rooms.roomId, roomId)).returning({id: rooms.roomId});
			if (!room) throw new Error("Room not found");
		});
	} catch (error) {
		return {success: false, error: isDuplicateRoomNumber(error)
			? "This room identifier already exists in that house." : "Could not update the room."};
	}
	revalidatePath("/rooms");
	revalidatePath("/tenants");
	revalidatePath(`/room_management/${roomId}`);
	return {success: true};
}
