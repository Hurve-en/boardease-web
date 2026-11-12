import {NextResponse} from "next/server";
import {z} from "zod";
import {authorize} from "@/lib/api-auth";
import {UpdateTenantSchema} from "@/lib/definitions";
import {updateTenant} from "@/lib/tenant-info";

export async function PATCH(
	request: Request,
	ctx: RouteContext<"/api/tenants/[tenantId]">,
) {
	const auth = await authorize(request, ["admin"]);
	if (auth.response) return auth.response;

	const {tenantId} = await ctx.params;
	if (!z.uuid().safeParse(tenantId).success) {
		return NextResponse.json({error: "Tenant not found"}, {status: 404});
	}

	const body = await request.json().catch(() => null);

	const parsed = UpdateTenantSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{error: parsed.error.issues[0].message},
			{status: 400},
		);
	}

	try {
		const tenant = await updateTenant(tenantId, parsed.data);
		if (!tenant) {
			return NextResponse.json({error: "Tenant not found."}, {status: 404});
		}

		return NextResponse.json(tenant);
	} catch {
		return NextResponse.json(
			{error: "Failed to update tenant."},
			{status: 500},
		);
	}
}
