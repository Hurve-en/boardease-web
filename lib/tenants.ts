import "server-only";

import {and, eq, isNull, sql} from "drizzle-orm";
import {revalidatePath} from "next/cache";
import {db} from "@/db";


import {userRoles, profiles,tenants, tenantRoomAssignment, rooms} from "@/drizzle/schema";

export type TenantData = {

    tenants: {
        id: string;
        name: string;
        status: "active" | "inactive";
        roomId: string | null;
        startDate: string;
        hasRecord: boolean;
        roomNumber: string;
        endDate: string | null;
    }[];


    rooms: {
        roomNumber: string;
        status: "occupied" | "unoccupied";
        monthlyRent: number;
        totalOccupants: number;
    }[];

    AvailableRooms: {
        roomId: string;
        roomNumber: string;
        monthlyRent: number;
    }[];

};

export async function getTenantData(): Promise<TenantData> {

    const [tenantSummary, roomSummary, availableRooms, profileOnlyTenants] =
    await Promise.all([

        // 1. every row in tenants, with their active room (if any)
        db.select({
            id: tenants.tenantId,
            name: sql<string>`CONCAT(${tenants.firstName}, ' ', ${tenants.lastName})`,
            status: sql<string>`case when ${tenantRoomAssignment.assignmentId} is not null then 'active' else 'inactive' end`,
            roomId: tenantRoomAssignment.roomId,
            assignedRoom: rooms.roomNumber,
            startDate: tenantRoomAssignment.startDate,
            endDate: tenantRoomAssignment.endDate,
        })
        .from(tenants)
        .leftJoin(tenantRoomAssignment, and(
            eq(tenants.tenantId, tenantRoomAssignment.tenantId),
            eq(tenantRoomAssignment.status, "active"),
        ))
        .leftJoin(rooms, eq(tenantRoomAssignment.roomId, rooms.roomId)),

        // 2. room summary
        db.select({
            roomNumber: rooms.roomNumber,
            status: rooms.status,
            totalOccupants: sql<number>`count(${tenantRoomAssignment.tenantId})`,
            monthlyRent: rooms.monthlyRent,
        })
        .from(rooms)
        .leftJoin(tenantRoomAssignment, and(
            eq(rooms.roomId, tenantRoomAssignment.roomId),
            eq(tenantRoomAssignment.status, "active"),
        ))
        .groupBy(rooms.roomId),

        // 3. available rooms
        db.select({
            roomId: rooms.roomId,
            roomNumber: rooms.roomNumber,
            monthlyRent: rooms.monthlyRent,
        })
        .from(rooms)
        .where(eq(rooms.status, "unoccupied")),

        // 4. profiles with the tenant role that have no tenants row yet
        db.select({
            id: profiles.id,
            name: profiles.name,
        })
        .from(profiles)
        .innerJoin(userRoles, and(
            eq(userRoles.userId, profiles.id),
            eq(userRoles.role, "tenant"),
        ))
        .leftJoin(tenants, eq(tenants.userId, profiles.id))
        .where(isNull(tenants.tenantId)),

    ]);

    // everyone: tenant records + profile-only tenants
    const allTenants: TenantData["tenants"] = [
        ...tenantSummary.map((t) => ({
            id: t.id,
            name: String(t.name ?? ""),
            roomNumber: String(t.assignedRoom ?? ""),
            status: String(t.status ?? "inactive") as "active" | "inactive",
            hasRecord: true,
            roomId: t.roomId,
            startDate: String(t.startDate ?? ""),
            endDate: t.endDate ? String(t.endDate) : null,
        })),
        ...profileOnlyTenants.map((p) => ({
            id: p.id,
            name: String(p.name ?? ""),
            roomNumber: "",
            status: "inactive" as const,
            hasRecord: false,
            roomId: null,
            startDate: "",
            endDate: null,
        })),
    ].sort((a, b) => a.name.localeCompare(b.name));

    return {

        tenants: allTenants,

        rooms: roomSummary.map((r) => ({
            roomNumber: String(r.roomNumber ?? ""),
            status: String(r.status ?? "unoccupied") as "occupied" | "unoccupied",
            monthlyRent: Number(r.monthlyRent ?? 0),
            totalOccupants: Number(r.totalOccupants ?? 0),
        })),

        AvailableRooms: availableRooms.map((a) => ({
            roomId: String(a.roomId ?? ""),
            roomNumber: String(a.roomNumber ?? ""),
            monthlyRent: Number(a.monthlyRent ?? 0),
        })),

    };

}


export async function AssignRoom(input:{
    id: string;
    name: string;
    contactNumber?: string;
    hasRecord: boolean;
    roomId: string;
}){


await db.transaction(async (tx) => {

  

revalidatePath("/tenants");


});
}