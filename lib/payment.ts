import "server-only";

import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
    bills,
    payments,
    paymentSubmissions,
    rooms,
    tenantRoomAssignment,
    tenants,
} from "@/db/schema";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
import { toCents } from "./bill-math";

export type PaymentErrorCode =
    | "BILL_NOT_FOUND"
    | "ALREADY_PAID"
    | "EXCEEDS_BALANCE"
    | "SUBMISSION_NOT_FOUND";

export class PaymentError extends Error {
    code: PaymentErrorCode;
    constructor(code: PaymentErrorCode, message: string){
        super(message);
        this.code = code;
    }
}

export type NewPayment = {
    billId: string;
    amount: number;
    paymentDate: string;
    recordedBy: string;
    submissionId?: string;
};

export async function recordPayment(input: NewPayment){
    return db.transaction(async (tx) => {
        // Lock the bill row so two concurrent payments can't both pass the balance check.
        const [bill] = await tx
            .select({
                billId: bills.billId,
                totalAmount: bills.totalAmount,
                outstandingBalance: bills.outstandingBalance,
            })
            .from(bills)
            .where(eq(bills.billId, input.billId))
            .for("update");

        if(!bill) throw new PaymentError("BILL_NOT_FOUND", "Bill not found.");

        const balanceCents = toCents(Number(bill.outstandingBalance));
        const totalCents = toCents(Number(bill.totalAmount));
        const amountCents = toCents(input.amount);

        if(balanceCents === 0){
            throw new PaymentError("ALREADY_PAID", "This bill is already paid.");
        }
        if(amountCents > balanceCents){
            throw new PaymentError("EXCEEDS_BALANCE", "Amount exceeds the bill balance.");
        }

        const newBalanceCents = balanceCents - amountCents;
        const status =
            newBalanceCents === 0
                ? "paid"
                : newBalanceCents < totalCents
                    ? "partial"
                    : "unpaid";

        const [payment] = await tx
            .insert(payments)
            .values({
                billId: bill.billId,
                recordedBy: input.recordedBy,
                amount: (amountCents / 100).toFixed(2),
                paymentDate: input.paymentDate,
            })
            .returning();

        const [updatedBill] = await tx
            .update(bills)
            .set({
                outstandingBalance: (newBalanceCents / 100).toFixed(2),
                status,
            })
            .where(eq(bills.billId, bill.billId))
            .returning({
                billId: bills.billId,
                outstandingBalance: bills.outstandingBalance,
                status: bills.status,
            });

        if(input.submissionId){
            const approved = await tx
                .update(paymentSubmissions)
                .set({
                    status: "approved",
                    reviewedBy: input.recordedBy,
                    reviewedAt: new Date(),
                    paymentDate: input.paymentDate,
                })
                .where(
                    and(
                        eq(paymentSubmissions.submissionId, input.submissionId),
                        eq(paymentSubmissions.billId, bill.billId),
                        eq(paymentSubmissions.status, "pending"),
                    ),
                )
                .returning({id: paymentSubmissions.submissionId});

            // Throwing rolls back the payment insert and bill update too.
            if(approved.length === 0){
                throw new PaymentError("SUBMISSION_NOT_FOUND", "Pending submission not found for this bill.");
            }
        }

        return {payment, bill: updatedBill};
    });
}

export type PaymentReceipt = {
    id: string;
    status: string;
    receiptUrl: string | null;
};

export async function getReceiptsForBill(billId: string): Promise<PaymentReceipt[]> {
    // Create this only when signing is requested so payment recording does not
    // depend on storage credentials during module initialization.
    const supabase = createSupabaseAdminClient();
    const rows = await db
        .select({
            id: paymentSubmissions.submissionId,
            status: paymentSubmissions.status,
            receiptPath: paymentSubmissions.receiptPath,
        })
        .from(paymentSubmissions)
        .where(
            and(
                eq(paymentSubmissions.billId, billId),
                isNotNull(paymentSubmissions.receiptPath),
            ),
        );

    return Promise.all(
        rows.map(async (row) => {
            const { data } = await supabase.storage
                .from("payment_reference")
                .createSignedUrl(row.receiptPath!, 3600); // valid for 1 hour

            return {
                id: row.id,
                status: row.status,
                receiptUrl: data?.signedUrl ?? null,
            };
        }),
    );
}



export type ReceivedPayment = {
    paymentId: string;
    billId: string;
    billingMonth: string;
    tenantName: string;
    roomNumber: string | null;
    amount: string;
    paymentDate: string;
};

export type PendingProof = {
    submissionId: string;
    billId: string;
    billingMonth: string;
    tenantName: string;
    roomNumber: string | null;
    amount: string;
    referenceNumber: string;
    submittedAt: string;
};

const tenantName = sql<string>`${tenants.firstName} || ' ' || ${tenants.lastName}`;

export async function getPaymentsOverview(month: string): Promise<{
    received: ReceivedPayment[];
    pending: PendingProof[];
}> {
    const activeRoom = and(
        eq(tenants.tenantId, tenantRoomAssignment.tenantId),
        eq(tenantRoomAssignment.status, "active"),
    );

    const [received, pending] = await Promise.all([
        db
            .select({
                paymentId: payments.paymentId,
                billId: bills.billId,
                billingMonth: bills.billingMonth,
                tenantName,
                roomNumber: rooms.roomNumber,
                amount: payments.amount,
                paymentDate: payments.paymentDate,
            })
            .from(payments)
            .innerJoin(bills, eq(payments.billId, bills.billId))
            .innerJoin(tenants, eq(bills.tenantId, tenants.tenantId))
            .leftJoin(tenantRoomAssignment, activeRoom)
            .leftJoin(rooms, eq(tenantRoomAssignment.roomId, rooms.roomId))
            .where(eq(bills.billingMonth, `${month}-01`))
            .orderBy(desc(payments.paymentDate), desc(payments.createdAt)),
        db
            .select({
                submissionId: paymentSubmissions.submissionId,
                billId: bills.billId,
                billingMonth: bills.billingMonth,
                tenantName,
                roomNumber: rooms.roomNumber,
                amount: paymentSubmissions.amount,
                referenceNumber: paymentSubmissions.referenceNumber,
                submittedAt: sql<string>`${paymentSubmissions.submittedAt}::text`,
            })
            .from(paymentSubmissions)
            .innerJoin(bills, eq(paymentSubmissions.billId, bills.billId))
            .innerJoin(tenants, eq(paymentSubmissions.submittedBy, tenants.tenantId))
            .leftJoin(tenantRoomAssignment, activeRoom)
            .leftJoin(rooms, eq(tenantRoomAssignment.roomId, rooms.roomId))
            .where(eq(paymentSubmissions.status, "pending"))
            .orderBy(desc(paymentSubmissions.submittedAt)),
    ]);

    return { received, pending };
}
