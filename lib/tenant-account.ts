import "server-only";
import {and, desc, eq, sql} from "drizzle-orm";
import {db} from "@/db";
import {boardingHouses, profiles, rooms, tenantRoomAssignment, tenants} from "@/db/schema";

const currentRoom = db.select({roomNumber: rooms.roomNumber, houseName: boardingHouses.name})
  .from(tenantRoomAssignment)
  .innerJoin(rooms, eq(rooms.roomId, tenantRoomAssignment.roomId))
  .leftJoin(boardingHouses, eq(rooms.boardingHouseId, boardingHouses.id))
  .where(and(eq(tenantRoomAssignment.tenantId, tenants.tenantId), eq(tenantRoomAssignment.status, "active")))
  .orderBy(desc(tenantRoomAssignment.startDate), desc(tenantRoomAssignment.assignmentId)).limit(1).as("current_room");

export async function getTenantAccount(userId: string) {
  const [account] = await db.select({
    name: profiles.name,
    email: profiles.email,
    tenantId: tenants.tenantId,
    roomNumber: currentRoom.roomNumber,
    boardingHouseName: currentRoom.houseName,
  }).from(profiles)
    .leftJoin(tenants, eq(tenants.userId, profiles.id))
    .leftJoinLateral(currentRoom, sql`true`)
    .where(eq(profiles.id, userId)).limit(1);
  if (!account) return null;
  return {
    profile: {name: account.name, email: account.email},
    tenancy: account.tenantId ? {roomNumber: account.roomNumber, boardingHouseName: account.boardingHouseName} : null,
    // Houses do not yet have an owner relationship.
    // Never expose an arbitrary admin's profile as the tenant's owner.
    owner: null,
  };
}
