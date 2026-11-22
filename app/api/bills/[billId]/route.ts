import {NextResponse} from "next/server";
import {z} from "zod";
import {authorize} from "@/lib/api-auth";
import {UpdateBillSchema} from "@/lib/definitions";
import {calculateTotal} from "@/lib/bill-math";
import {updateBill} from "@/lib/billing";

export async function PATCH(
	request: Request,
	ctx: RouteContext<"/api/bills/[billId]">,
) {
	const auth = await authorize(request, ["admin"]);
	if (auth.response) return auth.response;

	const {billId} = await ctx.params;
	if (!z.uuid().safeParse(billId).success) {
		return NextResponse.json({error: "Bill not found."}, {status: 404});
	}

	const body = await request.json().catch(() => null);
	const parsed = UpdateBillSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{error: parsed.error.issues[0].message},
			{status: 400},
		);
	}

	const {rentAmount, electricCharge, waterCharge} = parsed.data;
	if (
		Number(calculateTotal(rentAmount, electricCharge, waterCharge)) >
		99999999.99
	) {
		return NextResponse.json({error: "The total is too large."}, {status: 400});
	}

	try {
		const outcome = await updateBill(billId, parsed.data);
		switch (outcome.result) {
			case "not-found":
				return NextResponse.json({error: "Bill not found."}, {status: 404});
			case "due-before-month":
				return NextResponse.json(
					{error: "The due date can't be before the billing month."},
					{status: 400},
				);
			case "below-paid":
				return NextResponse.json(
					{
						error: `The new total can't be less than the ₱${outcome.paid} already paid.`,
					},
					{status: 409},
				);
			case "updated":
				return NextResponse.json(outcome.bill);
		}
	} catch {
		return NextResponse.json({error: "Failed to update bill."}, {status: 500});
	}
}
