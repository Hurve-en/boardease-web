import "server-only";

import {and, eq, sql} from "drizzle-orm";
import {db} from "@/db";
import {rooms, tenantRoomAssignment, tenants} from "@/db/schema";
import type {CreateTenantInput, UpdateTenantInput} from "@/lib/definitions";

export async function updateTenant(tenantId: string, input: UpdateTenantInput) {
	const [tenant] = await db
		.update(tenants)
		.set(input)
		.where(eq(tenants.tenantId, tenantId))
		.returning();

	return tenant;
}

export async function getUserRole(userId: string): Promise<string | undefined> {
	const rows = await db.execute<{role: string}>(
		sql`select role from public.user_roles where user_id = ${userId}`,
	);

	return rows[0]?.role;
}

export async function createTenant(input: CreateTenantInput) {
	const [tenant] = await db.insert(tenants).values(input).returning();
	return tenant;
}

export async function getTenantById(tenantId: string) {
	const [tenant] = await db
		.select({
			tenantId: tenants.tenantId,
			userId: tenants.userId,
			firstName: tenants.firstName,
			lastName: tenants.lastName,
			contactNumber: tenants.contactNumber,
			createdAt: tenants.createdAt,
			roomNumber: rooms.roomNumber,
			assignmentStart: tenantRoomAssignment.startDate,
			assignmentEnd: tenantRoomAssignment.endDate,
		})
		.from(tenants)
		.leftJoin(
			tenantRoomAssignment,
			and(
				eq(tenantRoomAssignment.tenantId, tenants.tenantId),
				eq(tenantRoomAssignment.status, "active"),
			),
		)
		.leftJoin(rooms, eq(rooms.roomId, tenantRoomAssignment.roomId))
		.where(eq(tenants.tenantId, tenantId))
		.limit(1);

	return tenant;
}
