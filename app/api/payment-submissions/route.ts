import { createClient } from "@supabase/supabase-js";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { authorize } from "@/lib/api-auth";
import { CreatePaymentSubmissionSchema } from "@/lib/definitions";
import { db } from "@/db";
import { bills, paymentSubmissions, tenants } from "@/db/schema";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request){
    const auth = await authorize(request, ["tenant"]);
    if (auth.response) return auth.response;

    const body = await request.json().catch(() => null);
    const parsed = CreatePaymentSubmissionSchema.safeParse(body);

    if(!parsed.success){
        return NextResponse.json(
            { error: parsed.error.issues[0].message },
            { status: 400 },
        );
    }
    // The receipt must live in this tenant's own storage folder
    // ("<user id>/<file>"), so they can't point at someone else's screenshot.
    const { receiptPath } = parsed.data;
    if(
        !receiptPath.startsWith(`${auth.user.id}/`) ||
        receiptPath.includes("..")
    ){
        return NextResponse.json(
            { error: "Invalid receipt path."},
            { status: 400 },
        );
    }

    try{
    //to check if the bill belongs to the tenant
        const [bill] = await db
            .select({
                id: bills.billId,
                tenantId: tenants.tenantId,
                outstandingBalance: bills.outstandingBalance,
            })
            .from(bills)
            .innerJoin(tenants, eq(bills.tenantId, tenants.tenantId))
            .where(
                and(
                    eq(bills.billId, parsed.data.billId),
                    eq(tenants.userId, auth.user.id),
                ),
            )
            .limit(1);

        if(!bill){
            return NextResponse.json({ error: "Bill not found." }, { status: 404});
        }

        // Compare whole cents to avoid floating-point money comparisons.
        const amountCents = Math.round(parsed.data.amount * 100);
        const balanceCents = Math.round(Number(bill.outstandingBalance) * 100);

        if(amountCents > balanceCents){
            return NextResponse.json(
                { error: "Amount exceeds the bill balance." },
                { status: 400 },
            );
        }

        const [submission] = await db
            .insert(paymentSubmissions)
            .values({
                billId: bill.id,
                submittedBy: bill.tenantId,
                amount: parsed.data.amount.toFixed(2),
                referenceNumber: parsed.data.referenceNumber,
                receiptPath: parsed.data.receiptPath,
            })
            .returning({
                submissionId: paymentSubmissions.submissionId,
                status: paymentSubmissions.status,
            });

        return NextResponse.json(submission, { status: 201 });
    }catch{
        return NextResponse.json(
            { error: "Failed to submit payment."},
            { status: 500 },
        );
    }
}

    export async function GET(request: Request){
        const auth = await authorize(request, ["admin"]);
        if(auth.response) return auth.response;

        try{
            const rows = await db
                .select({
                    submissionId: paymentSubmissions.submissionId,
                    billId: paymentSubmissions.billId,
                    submittedBy: paymentSubmissions.submittedBy,
                    amount: paymentSubmissions.amount,
                    referenceNumber: paymentSubmissions.referenceNumber,
                    receiptPath: paymentSubmissions.receiptPath,
                    status: paymentSubmissions.status,
                    reviewedBy: paymentSubmissions.reviewedBy,
                    reviewNote: paymentSubmissions.reviewNote,
                    submittedAt: paymentSubmissions.submittedAt,
                    reviewedAt: paymentSubmissions.reviewedAt,
                    tenantFirstName: tenants.firstName,
                    tenantLastName: tenants.lastName,
                    billingMonth: bills.billingMonth,
                    outstandingBalance: bills.outstandingBalance,
                })
                .from(paymentSubmissions)
                .leftJoin(bills, eq(paymentSubmissions.billId, bills.billId))
                .leftJoin(tenants, eq(paymentSubmissions.submittedBy, tenants.tenantId))
                .orderBy(desc(paymentSubmissions.submittedAt));

            const submissions = await Promise.all(
                rows.map(async (row) => {
                    const { data } = await supabaseAdmin.storage
                        .from("payment_reference")
                        .createSignedUrl(row.receiptPath, 60 * 60);

                    return{
                        ...row,
                        receiptUrl: data?.signedUrl ?? null,
                    };
                }),
            );

            return NextResponse.json(submissions, { status: 200 });
        }catch(err){
            console.error("GET PAYMENT SUBMISSION ERROR: ", err);
            return NextResponse.json(
                { error: "Failed to load payment submissions."},
                { status: 500 },
            );
        }
    }