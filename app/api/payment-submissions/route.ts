import { and, desc, eq, isNull, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { randomUUID } from "node:crypto";
import { notifyTenant } from "@/lib/notifications";
import { sendPushForNotice } from "@/lib/push";
import { authorize } from "@/lib/api-auth";
import { CreatePaymentSubmissionSchema } from "@/lib/definitions";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
import { db } from "@/db";
import { bills, paymentSubmissions, tenants, notifications, userRoles } from "@/db/schema";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function withCors(response: NextResponse) {
    Object.entries(corsHeaders).forEach(([name, value]) => {
        response.headers.set(name, value);
    });
    return response;
}

export function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    });
}

export async function POST(request: Request){
    const auth = await authorize(request, ["tenant"]);
    if (auth.response) return withCors(auth.response);

    const body = await request.json().catch(() => null);
    const parsed = CreatePaymentSubmissionSchema.safeParse(body);

    if(!parsed.success){
        return withCors(NextResponse.json(
            { error: parsed.error.issues[0].message },
            { status: 400 },
        ));
    }

    // The receipt must live in this tenant's own storage folder
    // ("<user id>/<file>"), so they can't point at someone else's screenshot.
    const { receiptPath } = parsed.data;
    if(
        !receiptPath.startsWith(`${auth.user.id}/`) ||
        receiptPath.includes("..")
    ){
        return withCors(NextResponse.json(
            { error: "Invalid receipt path." },
            { status: 400 },
        ));
    }

    try{
        // Check that the bill belongs to the tenant.
        const [bill] = await db
            .select({
                id: bills.billId,
                tenantId: tenants.tenantId,
                firstName: tenants.firstName, lastName: tenants.lastName,
                outstandingBalance: bills.outstandingBalance,
            })
            .from(bills)
            .innerJoin(tenants, eq(bills.tenantId, tenants.tenantId))
            .where(
                and(
                    eq(bills.billId, parsed.data.billId),
                    eq(tenants.userId, auth.user.id),
                    isNull(tenants.archivedAt),
                ),
            )
            .limit(1);

        if(!bill){
            return withCors(NextResponse.json({ error: "Bill not found." }, { status: 404 }));
        }

        // Compare whole cents to avoid floating-point money comparisons.
        const amountCents = Math.round(parsed.data.amount * 100);
        const balanceCents = Math.round(Number(bill.outstandingBalance) * 100);

        if(amountCents > balanceCents){
            return withCors(NextResponse.json(
                { error: "Amount exceeds the bill balance." },
                { status: 400 },
            ));
        }

        const { submission, notices } = await db.transaction(async tx => {
            const [submission] = await tx
                .insert(paymentSubmissions)
                .values({
                    billId: bill.id,
                    submittedBy: bill.tenantId,
                    amount: parsed.data.amount.toFixed(2),
                    referenceNumber: parsed.data.referenceNumber,
                    receiptPath: parsed.data.receiptPath,
                    paymentDate: parsed.data.paymentDate,
                })
                .returning({
                    submissionId: paymentSubmissions.submissionId,
                    status: paymentSubmissions.status,
                });
            const admins = await tx.select({ recipientId: userRoles.userId }).from(userRoles).where(eq(userRoles.role, "admin"));
            const notices = admins.length
                ? await tx.insert(notifications).values(admins.map(admin => ({
                    ...admin, role: "admin" as const, billId: bill.id, eventKey: submission.submissionId,
                    kind: "proof_submitted", title: "Payment proof submitted",
                    body: `${bill.firstName} ${bill.lastName} submitted proof for ₱${parsed.data.amount.toFixed(2)}.`,
                }))).returning()
                : [];
            return { submission, notices };
        });

        // Send pushes only after the transaction has committed
        await Promise.all(notices.map((n) => sendPushForNotice(n)));

        return withCors(NextResponse.json(submission, { status: 201 }));
    }catch{
        return withCors(NextResponse.json(
            { error: "Failed to submit payment." },
            { status: 500 },
        ));
    }
}

export async function GET(request: Request) {
    const auth = await authorize(request, ["admin"]);
    if (auth.response) return withCors(auth.response);

    const billId = new URL(request.url).searchParams.get("billId");

    try {
        const supabaseAdmin = createSupabaseAdminClient();

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
                paymentDate: paymentSubmissions.paymentDate,
                tenantFirstName: tenants.firstName,
                tenantLastName: tenants.lastName,
                billingMonth: bills.billingMonth,
                outstandingBalance: bills.outstandingBalance,
            })
            .from(paymentSubmissions)
            .leftJoin(bills, eq(paymentSubmissions.billId, bills.billId))
            .leftJoin(tenants, eq(paymentSubmissions.submittedBy, tenants.tenantId))
            .where(billId ? eq(paymentSubmissions.billId, billId) : undefined)
            .orderBy(desc(paymentSubmissions.submittedAt));

        const submissions = await Promise.all(
            rows.map(async (row) => {
                const { data } = await supabaseAdmin.storage
                    .from("payment_reference")
                    .createSignedUrl(row.receiptPath, 60 * 60);

                return {
                    ...row,
                    receiptUrl: data?.signedUrl ?? null,
                };
            }),
        );

        return withCors(NextResponse.json(submissions, { status: 200 }));
    } catch (error) {
        console.error("GET PAYMENT SUBMISSION ERROR:", error);
        const missingStorageKey =
            error instanceof Error &&
            /Missing (SUPABASE_SECRET_KEY|SUPABASE_SECRET|NEXT_PUBLIC_SUPABASE_URL)/.test(error.message);
        return withCors(
            NextResponse.json(
                {
                    error: missingStorageKey
                        ? "Receipt image signing is not configured. Add the Supabase server secret to the web server environment and restart it."
                        : "Failed to load payment submissions.",
                },
                { status: missingStorageKey ? 503 : 500 },
            ),
        );
    }
}

const ReviewSubmissionSchema = z.object({
    submissionId: z.uuid(),
    status: z.enum(["pending", "needs_update"]),
    reviewNote: z.string().trim().max(500).optional(),
});

export async function PATCH(request: Request) {
    const auth = await authorize(request, ["admin"]);
    if (auth.response) return withCors(auth.response);

    const body = await request.json().catch(() => null);
    const parsed = ReviewSubmissionSchema.safeParse(body);
    if (!parsed.success) {
        return withCors(NextResponse.json(
            {error: "Provide a valid submission status and review note."},
            {status: 400},
        ));
    }

    try {
        const {submissionId, status, reviewNote} = parsed.data;
        const { updated, notice } = await db.transaction(async tx => {
            const [previous] = await tx.select({ status: paymentSubmissions.status, note: paymentSubmissions.reviewNote })
                .from(paymentSubmissions).where(eq(paymentSubmissions.submissionId, submissionId)).for("update");
            const [updated] = await tx
                .update(paymentSubmissions)
                .set({
                    status,
                    reviewedBy: status === "needs_update" ? auth.user.id : null,
                    reviewedAt: status === "needs_update" ? new Date() : null,
                    reviewNote: status === "needs_update" ? reviewNote || null : null,
                })
                .where(and(
                    eq(paymentSubmissions.submissionId, submissionId),
                    or(
                        eq(paymentSubmissions.status, "pending"),
                        eq(paymentSubmissions.status, "needs_update"),
                    ),
                ))
                .returning({
                    submissionId: paymentSubmissions.submissionId,
                    status: paymentSubmissions.status,
                    reviewNote: paymentSubmissions.reviewNote,
                    billId: paymentSubmissions.billId, tenantId: paymentSubmissions.submittedBy,
                    reviewedAt: paymentSubmissions.reviewedAt,
                });
            let notice: Awaited<ReturnType<typeof notifyTenant>> = null;
            if (updated && status === "needs_update" && (previous.status !== status || previous.note !== updated.reviewNote)) {
                notice = await notifyTenant(tx, updated.tenantId, {
                    billId: updated.billId, eventKey: randomUUID(), kind: "proof_needs_update",
                    title: "Please update your payment proof", body: updated.reviewNote || "Please submit a corrected payment photo.",
                });
            }
            return { updated, notice };
        });

        if (!updated) {
            return withCors(NextResponse.json(
                {error: "This submission is unavailable or has already been approved."},
                {status: 409},
            ));
        }

        // Send the push only after the transaction has committed
        if (notice) await sendPushForNotice(notice);

        return withCors(NextResponse.json(updated));
    } catch (error) {
        console.error("PATCH PAYMENT SUBMISSION ERROR:", error);
        return withCors(NextResponse.json(
            {error: "Failed to update the payment submission."},
            { status: 500 },
        ));
    }
}