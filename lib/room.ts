import "server-only";

import {and, eq, sql} from "drizzle-orm";
import {rooms, tenantRoomAssignment, tenants} from "@/db/schema";
import {db} from "@/db";

export type RoomSummary = {
	total: number;
	occupied: number;
	unoccupied: number;
};

export type RoomListItem = {
	roomId: string;
	roomNumber: string;
	monthlyRent: string;
	maxOccupancy: number;
	status: "occupied" | "unoccupied";
	createdAt: Date;
	currentTenant: string | null;
	assignmentStart: string | null;
};

export async function getRoomSummary(): Promise<RoomSummary> {
	const [row] = await db
		.select({
			total: sql<number>`count(*)`,
			occupied: sql<number>`count(*) filter (where ${rooms.status} = 'occupied')`,
			unoccupied: sql<number>`count(*) filter (where ${rooms.status} = 'unoccupied')`,
		})
		.from(rooms);

	return {
		total: Number(row?.total ?? 0),
		occupied: Number(row?.occupied ?? 0),
		unoccupied: Number(row?.unoccupied ?? 0),
	};
}

export async function getRooms(): Promise<RoomListItem[]> {
	return db
		.select({
			roomId: rooms.roomId,
			roomNumber: rooms.roomNumber,
			monthlyRent: rooms.monthlyRent,
			maxOccupancy: rooms.maxOccupancy,
			status: rooms.status,
			createdAt: rooms.createdAt,
			currentTenant: sql<
				string | null
			>`${tenants.firstName} || ' ' || ${tenants.lastName}`,
			assignmentStart: tenantRoomAssignment.startDate,
		})
		.from(rooms)
		.leftJoin(
			tenantRoomAssignment,
			and(
				eq(tenantRoomAssignment.roomId, rooms.roomId),
				eq(tenantRoomAssignment.status, "active"),
			),
		) // first join is for the frontend to determine if it has an active tenant or not
		.leftJoin(tenants, eq(tenants.tenantId, tenantRoomAssignment.tenantId))
		.orderBy(rooms.roomNumber); // second join is for the tenant's name
}
