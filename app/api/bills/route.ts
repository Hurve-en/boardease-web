import {NextResponse} from "next/server";
import {authorize} from "@/lib/api-auth";
import {CreateBillSchema} from "@/lib/definitions";
import {isUniqueViolation} from "@/lib/db-errors";
import {calculateTotal} from "@/lib/bill-math";
import {createBill, getBillsForMonth, getTenantRent} from "@/lib/billing";
import {currentBillingMonth} from "@/lib/dashboard";

// GET /api/bills?month=2026-11 → that month's bills + summary (defaults to this month, Manila time)
export async function GET(request: Request) {
	const auth = await authorize(request, ["admin"]);
	if (auth.response) return auth.response;

	const month =
		new URL(request.url).searchParams.get("month") ??
		currentBillingMonth().slice(0, 7);
	if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
		return NextResponse.json({error: "Use month=YYYY-MM."}, {status: 400});
	}

	try {
		return NextResponse.json(await getBillsForMonth(`${month}-01`));
	} catch {
		return NextResponse.json({error: "Failed to load bills."}, {status: 500});
	}
}

// POST /api/bills → create one monthly bill
export async function POST(request: Request) {
	const auth = await authorize(request, ["admin"]);
	if (auth.response) return auth.response;

	const body = await request.json().catch(() => null);

	const parsed = CreateBillSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{error: parsed.error.issues[0].message},
			{status: 400},
		);
	}

	const {tenantId, billingMonth, dueDate, electricCharge, waterCharge} =
		parsed.data;

	try {
		const tenant = await getTenantRent(tenantId);
		if (!tenant) {
			return NextResponse.json({error: "Tenant not found."}, {status: 404});
		}

		// The rent from the form wins; otherwise use the room's rent.
		const rentAmount =
			parsed.data.rentAmount ??
			(tenant.monthlyRent === null ? undefined : Number(tenant.monthlyRent));
		if (rentAmount === undefined) {
			return NextResponse.json(
				{
					error:
						"This tenant has no room assigned. Enter the rent amount or assign a room first.",
				},
				{status: 400},
			);
		}

		// The column holds at most 99,999,999.99 — check the total before saving.
		if (
			Number(calculateTotal(rentAmount, electricCharge, waterCharge)) >
			99999999.99
		) {
			return NextResponse.json(
				{error: "The total is too large."},
				{status: 400},
			);
		}

		const bill = await createBill({
			tenantId,
			billingMonth,
			dueDate,
			rentAmount,
			electricCharge,
			waterCharge,
		});
		return NextResponse.json(bill, {status: 201});
	} catch (error) {
		if (isUniqueViolation(error)) {
			return NextResponse.json(
				{error: "This tenant already has a bill for that month."},
				{status: 409},
			);
		}
		return NextResponse.json({error: "Failed to create bill."}, {status: 500});
	}
}
