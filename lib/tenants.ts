import "server-only";

import {and, desc, eq, inArray, isNotNull, isNull, notExists, sql} from "drizzle-orm";
import {revalidatePath} from "next/cache";
import {db} from "@/db";
import {createClient} from "@/lib/supabase/server";
import {
	userRoles,
	profiles,
	tenants,
	tenantRoomAssignment,
	boardingHouses,
	rooms,
} from "@/db/schema";
import { UpdateActionState } from "./room_management";

export type TenantData = {

    tenants: {
        id: string;
        name: string;
        contactNumber: string;
        status: "active" | "inactive" | "archived";
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
        boardingHouseName: string | null;
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
            contactNumber: tenants.contactNumber,
            archivedAt: tenants.archivedAt,
            status: sql<string>`case when ${tenants.archivedAt} is not null then 'archived' when ${tenantRoomAssignment.assignmentId} is not null then 'active' else 'inactive' end`,
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
            boardingHouseName: boardingHouses.name,
            roomId: rooms.roomId,
            roomNumber: rooms.roomNumber,
            monthlyRent: rooms.monthlyRent,
        })
        .from(rooms)
        .leftJoin(boardingHouses, eq(rooms.boardingHouseId, boardingHouses.id))
        .where(notExists(
            db.select({assignmentId: tenantRoomAssignment.assignmentId})
                .from(tenantRoomAssignment)
                .where(and(
                    eq(tenantRoomAssignment.roomId, rooms.roomId),
                    eq(tenantRoomAssignment.status, "active"),
                )),
        )),

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
            contactNumber: String(t.contactNumber ?? ""),
            roomNumber: String(t.assignedRoom ?? ""),
            status: String(t.status ?? "inactive") as "active" | "inactive" | "archived",
            hasRecord: true,
            roomId: t.roomId,
            startDate: String(t.startDate ?? ""),
            endDate: t.endDate ? String(t.endDate) : null,
        })),
        ...profileOnlyTenants.map((p) => ({
            id: p.id,
            name: String(p.name ?? ""),
            contactNumber: "",
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
            boardingHouseName: a.boardingHouseName,
            roomId: String(a.roomId ?? ""),
            roomNumber: String(a.roomNumber ?? ""),
            monthlyRent: Number(a.monthlyRent ?? 0),
        })),

    };

}

export type ArchivedTenant = {
    id: string;
    name: string;
    contactNumber: string;
    archivedAt: string;
    lastRoomNumber: string | null;
};

export async function getArchivedTenants(): Promise<ArchivedTenant[]> {
    const archived = await db
        .select({
            id: tenants.tenantId,
            firstName: tenants.firstName,
            lastName: tenants.lastName,
            contactNumber: tenants.contactNumber,
            archivedAt: tenants.archivedAt,
        })
        .from(tenants)
        .where(isNotNull(tenants.archivedAt))
        .orderBy(desc(tenants.archivedAt));

    if (archived.length === 0) return [];

    // Most recent stay first, so the first row seen per tenant is their last room.
    const stays = await db
        .select({tenantId: tenantRoomAssignment.tenantId, roomNumber: rooms.roomNumber})
        .from(tenantRoomAssignment)
        .innerJoin(rooms, eq(tenantRoomAssignment.roomId, rooms.roomId))
        .where(inArray(tenantRoomAssignment.tenantId, archived.map((t) => t.id)))
        .orderBy(desc(tenantRoomAssignment.endDate), desc(tenantRoomAssignment.startDate));

    const lastRoom = new Map<string, string>();
    for (const stay of stays) {
        if (!lastRoom.has(stay.tenantId)) lastRoom.set(stay.tenantId, stay.roomNumber);
    }

    return archived.map((t) => ({
        id: t.id,
        name: `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim(),
        contactNumber: t.contactNumber ?? "",
        archivedAt: t.archivedAt ? new Date(t.archivedAt).toISOString() : "",
        lastRoomNumber: lastRoom.get(t.id) ?? null,
    }));
}

export async function AssignRoom(input: {
    tenant_Id: string;
    roomId: string;
    hasRecord: boolean;
    start_date: string;
    end_date: string;
    status: "active" | "inactive";
}) {

    const supabase = await createClient()
    const{data:{user}} = await supabase.auth.getUser()

    if(!user) throw new Error("User not authenticated")

        try{
            const assignment = await db.transaction(async(tx) => {
                let tenantId = input.tenant_Id;
                const [existingTenant] = await tx
                    .select({ tenantId: tenants.tenantId, archivedAt: tenants.archivedAt })
                    .from(tenants)
                    .where(eq(tenants.tenantId, input.tenant_Id))
                    .limit(1);

                if (!existingTenant) {
                    const [profile] = await tx
                        .select({
                            id: profiles.id,
                            name: profiles.name,
                        })
                        .from(profiles)
                        .where(eq(profiles.id, input.tenant_Id))
                        .limit(1);

                    if (!profile) {
                        throw new Error("Tenant not found");
                    }

                    const nameParts = profile.name.trim().split(/\s+/);
                    const firstName = nameParts.shift() || "Tenant";
                    const lastName = nameParts.join(" ") || firstName;
                    const [createdTenant] = await tx
                        .insert(tenants)
                        .values({
                            userId: profile.id,
                            firstName,
                            lastName,
                            contactNumber: "",
                        })
                        .returning({ tenantId: tenants.tenantId });

                    tenantId = createdTenant.tenantId;
                } else if (existingTenant.archivedAt) {
                    throw new Error("Archived tenants must be restored before assigning a room");
                }

                const previousTenantAssignments = await tx
                    .select({ roomId: tenantRoomAssignment.roomId })
                    .from(tenantRoomAssignment)
                    .where(and(
                        eq(tenantRoomAssignment.tenantId, tenantId),
                        eq(tenantRoomAssignment.status, "active"),
                    ));

                await tx
                    .update(tenantRoomAssignment)
                    .set({status: "inactive"})
                    .where(and(
                        eq(tenantRoomAssignment.tenantId, tenantId),
                        eq(tenantRoomAssignment.status, "active"),
                    ));

                await tx
                    .update(tenantRoomAssignment)
                    .set({status: "inactive"})
                    .where(and(
                        eq(tenantRoomAssignment.roomId, input.roomId),
                        eq(tenantRoomAssignment.status, "active"),
                    ));

                for (const previousAssignment of previousTenantAssignments) {
                    if (previousAssignment.roomId !== input.roomId) {
                        await tx
                            .update(rooms)
                            .set({status: "unoccupied"})
                            .where(eq(rooms.roomId, previousAssignment.roomId));
                    }
                }

                const[created] = await tx 
                .insert(tenantRoomAssignment)
                .values({
                    tenantId,
                    roomId: input.roomId,
                    startDate: input.start_date,
                    endDate: input.end_date,
                    status: input.status,
                })
                .returning()

                await tx
                    .update(rooms)
                    .set({status: input.status === "active" ? "occupied" : "unoccupied"})
                    .where(eq(rooms.roomId, input.roomId));

                return created

                })

                revalidatePath("/tenants");
                revalidatePath("/rooms");
                revalidatePath(`/room_management/${input.roomId}`);
                return{ok: true, assignment}

            }catch (error) {
                console.error("Error assigning room:", error);
                throw new Error("Failed to assign room. Please try again.");
            }


        }







function manilaToday() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

function dayAfter(value: string) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

export async function setTenantArchived(
    tenantId: string,
    archived: boolean,
): Promise<UpdateActionState> {
    if (!tenantId.trim()) return {success: false, error: "A valid tenant is required."};

    try {
        if (archived) {
            const today = manilaToday();
            await db.transaction(async (tx) => {
                const [tenant] = await tx
                    .select({tenantId: tenants.tenantId, archivedAt: tenants.archivedAt})
                    .from(tenants)
                    .where(eq(tenants.tenantId, tenantId))
                    .limit(1);
                if (!tenant) throw new Error("Tenant not found.");
                if (tenant.archivedAt) return;

                const assignments = await tx
                    .select({assignmentId: tenantRoomAssignment.assignmentId, roomId: tenantRoomAssignment.roomId, startDate: tenantRoomAssignment.startDate})
                    .from(tenantRoomAssignment)
                    .where(and(
                        eq(tenantRoomAssignment.tenantId, tenantId),
                        eq(tenantRoomAssignment.status, "active"),
                    ));

                for (const assignment of assignments) {
                    const endDate = assignment.startDate < today ? today : dayAfter(assignment.startDate);
                    await tx
                        .update(tenantRoomAssignment)
                        .set({status: "inactive", endDate})
                        .where(eq(tenantRoomAssignment.assignmentId, assignment.assignmentId));

                    const [remainingAssignment] = await tx
                        .select({assignmentId: tenantRoomAssignment.assignmentId})
                        .from(tenantRoomAssignment)
                        .where(and(
                            eq(tenantRoomAssignment.roomId, assignment.roomId),
                            eq(tenantRoomAssignment.status, "active"),
                        ))
                        .limit(1);
                    if (!remainingAssignment) {
                        await tx.update(rooms)
                            .set({status: "unoccupied"})
                            .where(eq(rooms.roomId, assignment.roomId));
                    }
                }

                await tx.update(tenants)
                    .set({archivedAt: new Date()})
                    .where(eq(tenants.tenantId, tenantId));
            });
        } else {
            const [restored] = await db.update(tenants)
                .set({archivedAt: null})
                .where(eq(tenants.tenantId, tenantId))
                .returning({tenantId: tenants.tenantId});
            if (!restored) return {success: false, error: "Tenant not found."};
        }
    } catch (error) {
        console.error(archived ? "Error archiving tenant:" : "Error restoring tenant:", error);
        return {success: false, error: archived ? "Could not archive this tenant." : "Could not restore this tenant."};
    }

    revalidatePath("/tenants");
    revalidatePath("/tenants/archived");
    revalidatePath("/rooms");
    revalidatePath("/dashboard");
    revalidatePath("/monthly-bills/new");
    return {success: true, message: archived ? "Tenant archived. Payment and bill history was kept." : "Tenant restored."};
}
