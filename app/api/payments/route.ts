import { NextResponse } from "next/server";

import { authorize } from "@/lib/api-auth";
import { CreatePaymentSchema } from "@/lib/definitions";
import { PaymentError, recordPayment, type PaymentErrorCode } from "@/lib/payment";

const statusByCode: Record<PaymentErrorCode, number> = {
    BILL_NOT_FOUND: 404,
    SUBMISSION_NOT_FOUND: 404,
    ALREADY_PAID: 409,
    EXCEEDS_BALANCE: 400,
};

export async function POST(request: Request){
    const auth = await authorize(request, ["admin"]);
    if(auth.response) return auth.response;

    const body = await request.json().catch(() => null);
    const parsed = CreatePaymentSchema.safeParse(body);
    if(!parsed.success){
        return NextResponse.json(
            { error: parsed.error.issues[0].message},
            { status: 400},
        );
    }

    try{
        const result = await recordPayment({
            ...parsed.data,
            recordedBy: auth.user.id,
        });
        return NextResponse.json(result, {status: 201});
    } catch(error){
        if(error instanceof PaymentError){
            return NextResponse.json(
                { error: error.message, code: error.code},
                { status: statusByCode[error.code]},
            );
        }
        return NextResponse.json(
            { error: "Failed to record payment."},
            {status: 500},
        );
    }
}