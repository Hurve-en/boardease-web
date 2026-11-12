import "server-only";

import {eq} from "drizzle-orm";
import {db} from "@/db";
import {tenants} from "@/db/schema";
import type {UpdateTenantInput} from "@/lib/definitions";

export async function updateTenant(tenantId: string, input: UpdateTenantInput) {
	const [tenant] = await db
		.update(tenants)
		.set(input)
		.where(eq(tenants.tenantId, tenantId))
		.returning();

	return tenant;
}
