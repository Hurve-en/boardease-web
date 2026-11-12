import {NextResponse} from "next/server";
import {authorize} from "@/lib/api-auth";
import {CreateTenantSchema} from "@/lib/definitions";
import {isForeignKeyViolation, isUniqueViolation} from "@/lib/db-errors";
import {createTenant, getUserRole} from "@/lib/tenant-info";

export async function POST(request: Request) {
	const auth = await authorize(request, ["admin"]);
	if (auth.response) return auth.response;

	const body = await request.json().catch(() => null);

	const parsed = CreateTenantSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{error: parsed.error.issues[0].message},
			{status: 400},
		);
	}

	try {
		const role = await getUserRole(parsed.data.userId);
		if (!role) {
			return NextResponse.json({error: "User not found."}, {status: 404});
		}
		if (role !== "tenant") {
			return NextResponse.json(
				{error: "Only tenant accounts can be added as tenants."},
				{status: 400},
			);
		}

		const tenant = await createTenant(parsed.data);
		return NextResponse.json(tenant, {status: 201});
	} catch (error) {
		if (isUniqueViolation(error)) {
			return NextResponse.json(
				{error: "This user is already a tenant."},
				{status: 409},
			);
		}
		if (isForeignKeyViolation(error)) {
			return NextResponse.json({error: "User not found."}, {status: 404});
		}
		return NextResponse.json(
			{error: "Failed to create tenant."},
			{status: 500},
		);
	}
}
