import "server-only";
import {and, desc, eq, sql} from "drizzle-orm";
import {db} from "@/db";
import {profiles, rooms, tenantRoomAssignment, tenants} from "@/db/schema";

const currentRoom = db.select({roomNumber: rooms.roomNumber})
  .from(tenantRoomAssignment)
  .innerJoin(rooms, eq(rooms.roomId, tenantRoomAssignment.roomId))
  .where(and(eq(tenantRoomAssignment.tenantId, tenants.tenantId), eq(tenantRoomAssignment.status, "active")))
  .orderBy(desc(tenantRoomAssignment.startDate), desc(tenantRoomAssignment.assignmentId)).limit(1);

export async function getTenantAccount(userId: string) {
  const [account] = await db.select({
    name: profiles.name,
    email: profiles.email,
    tenantId: tenants.tenantId,
    roomNumber: sql<string | null>`(${currentRoom})`,
  }).from(profiles)
    .leftJoin(tenants, eq(tenants.userId, profiles.id))
    .where(eq(profiles.id, userId)).limit(1);
  if (!account) return null;
  return {
    profile: {name: account.name, email: account.email},
    tenancy: account.tenantId ? {roomNumber: account.roomNumber, boardingHouseName: null} : null,
    // There is no boarding-house/owner relationship in the current schema.
    // Never expose an arbitrary admin's profile as the tenant's owner.
    owner: null,
  };
}
