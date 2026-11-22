import "server-only";

import {and, eq} from "drizzle-orm";
import { db } from "@/db";
import { bills, payments, paymentSubmissions } from "@/db/schema";
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