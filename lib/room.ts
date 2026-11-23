import "server-only";

import type {CreateRoomInput} from "@/lib/definitions";

import {and, eq, sql} from "drizzle-orm";
import {boardingHouses, rooms, tenantRoomAssignment, tenants} from "@/db/schema";
import {db} from "@/db";
import {isUniqueViolation} from "./db-errors";

export type RoomSummary = {
	total: number;
	occupied: number;
	unoccupied: number;
};

export type RoomListItem = {
	boardingHouseName: string | null;
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
	return (
		db
			.select({
				boardingHouseName: boardingHouses.name,
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
			.leftJoin(boardingHouses, eq(rooms.boardingHouseId, boardingHouses.id))
			// first join is for the frontend to determine if it has an active tenant or not
			.leftJoin(
				tenantRoomAssignment,
				and(
					eq(tenantRoomAssignment.roomId, rooms.roomId),
					eq(tenantRoomAssignment.status, "active"),
				),
			)
			// second join is for the tenant's name
			.leftJoin(tenants, eq(tenants.tenantId, tenantRoomAssignment.tenantId))
			.orderBy(rooms.roomNumber)
	);
}

export function getBoardingHouses() {
	return db.select({name: boardingHouses.name}).from(boardingHouses).orderBy(boardingHouses.name);
}

type RoomTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function resolveHouseId(tx: RoomTransaction, name: string) {
	const [house] = await tx.insert(boardingHouses).values({name})
		.onConflictDoUpdate({target: boardingHouses.name, set: {name}})
		.returning({id: boardingHouses.id});
	return house.id;
}

export async function createRoom(input: CreateRoomInput) {
	return db.transaction(async (tx) => {
		const boardingHouseId = input.boardingHouseName ? await resolveHouseId(tx, input.boardingHouseName) : null;
		const [room] = await tx.insert(rooms).values({
			boardingHouseId,
			roomNumber: input.roomNumber,
			monthlyRent: input.monthlyRent.toFixed(2),
			maxOccupancy: input.maxOccupancy,
		}).returning();
		return room;
	});
}

export function isDuplicateRoomNumber(error: unknown): boolean {
	return isUniqueViolation(error);
}
