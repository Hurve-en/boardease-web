"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { billNumber } from "@/lib/bill-math";
import {
    PAYMENTS_PATH,
    manilaToday,
    resolveMonth,
    money,
    monthLabel,
    statusClass,
    type Bill,
    type Receipt,
} from "@/lib/payment-ui";

export default function PaymentDetail({
    billId,
    month: monthParam,
}: {
    billId: string;
    month?: string;
}){
    const month = resolveMonth(monthParam);
    const backHref = `${PAYMENTS_PATH}?month=${month}`;

    const [bill, setBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState(manilaToday);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [receiptsLoading, setReceiptsLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Load this bill (the list endpoint is reused and filtered by id).
    useEffect(() => {
        let cancelled = false;

        async function loadBill(){
            setLoading(true);

            try{
                const response = await fetch(`/api/bills?month=${month}`, {
                    cache: "no-store",
                });
                const data = await response.json();

                if(!response.ok){
                    throw new Error(data.error || "Could not load the bill.");
                }

                const found = (data.bills ?? []).find(
                    (item: Bill) => item.billId === billId,
                );
                if(!cancelled) setBill(found ?? null);
            }catch(cause){
                if(!cancelled){
                    setBill(null);
                    setError(
                        cause instanceof Error ? cause.message : "Could not load the bill.",
                    );
                }
            }finally{
                if(!cancelled) setLoading(false);
            }
        }

        void loadBill();
        return () => {
            cancelled = true;
        };
    }, [billId, month, reloadKey]);

    // Load the submitted receipt images for this bill.
    useEffect(() => {
        let cancelled = false;
        setReceiptsLoading(true);

        fetch(`/api/payment-submissions?billId=${billId}`, { cache: "no-store" })
            .then((res) => res.json())
            .then((data) => {
                if(!cancelled) setReceipts(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if(!cancelled) setReceipts([]);
            })
            .finally(() => {
                if(!cancelled) setReceiptsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [billId]);

    // Close the image pop-up with the Escape key.
    useEffect(() => {
        if(!previewUrl) return;

        function onKeyDown(event: KeyboardEvent){
            if(event.key === "Escape") setPreviewUrl(null);
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [previewUrl]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>){
        event.preventDefault();
        setError("");
        setSuccess("");

        if(!bill){
            setError("Bill not found.");
            return;
        }

        const amountInCents = Math.round(Number(amount) * 100);
        const balanceInCents = Math.round(Number(bill.outstandingBalance) * 100);

        if (!/^\d+(\.\d{1,2})?$/.test(amount) || amountInCents <= 0) {
            setError("Enter an amount greater than zero with up to two decimal places.");
            return;
        }
        if(amountInCents > balanceInCents){
            setError("The payment cannot exceed the outstanding balance.");
            return;
        }
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate) ||
            new Date(`${paymentDate}T00:00:00Z`).toISOString().slice(0, 10) !==
                paymentDate
        ) {
            setError("Enter a valid payment date.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({
                    billId: bill.billId,
                    amount: amountInCents / 100,
                    paymentDate,
                }),
            });
            const data = await response.json();

            if(!response.ok){
                throw new Error(data.error || "Could not record payment.");
            }

            setSuccess("Payment recorded.");
            setAmount("");
            // Reload so the balance and status are current.
            setReloadKey((value) => value + 1);
        } catch (cause) {
            setError(
                cause instanceof Error ? cause.message : "Could not record payment.",
            );
        }finally{
            setSaving(false);
        }
    }

    if(loading && !bill){
        return (
            <div className="dashboard-content">
                <p className="text-sm text-[#8a8077]">Loading bill…</p>
            </div>
        );
    }

    if(!bill){
        return (
            <div className="dashboard-content">
                <section className="panel py-12 text-center">
                    <h2 className="m-0 text-lg font-semibold text-[#322d29]">Bill not found</h2>
                    <p className="mb-5 mt-2 text-sm text-[#8a8077]">
                        {error || "This bill doesn't exist for the selected month."}
                    </p>
                    <Link
                        href={backHref}
                        className="rounded-lg border border-[#e0d8cb] bg-white px-4 py-3 text-sm font-semibold text-[#60422f] hover:bg-[#f7f3ec]"
                    >
                        ← Back to payments
                    </Link>
                </section>
            </div>
        );
    }

    const paid = Number(bill.totalAmount) - Number(bill.outstandingBalance);
    const fullyPaid = Number(bill.outstandingBalance) <= 0;

    return (
        <div className="dashboard-content">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="eyebrow">PAYMENTS</p>
                    <h1 className="m-0 text-3xl font-semibold tracking-tight text-[#322d29]">
                        Bill {billNumber(bill.billingMonth, bill.roomNumber)}
                    </h1>
                    <p className="mt-2 text-sm text-[#8a8077]">
                        {bill.tenantName} · Room {bill.roomNumber ?? "—"} · {monthLabel(bill.billingMonth)}
                    </p>
                </div>
                <Link
                    href={backHref}
                    className="rounded-lg border border-[#e0d8cb] bg-white px-4 py-3 text-sm font-semibold text-[#60422f] hover:bg-[#f7f3ec]"
                >
                    ← Back to rooms
                </Link>
            </div>

            {error && (
                <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </p>
            )}
            {success && (
                <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {success}
                </p>
            )}

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_390px]">
                <div className="min-w-0">
                    <section className="panel">
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e7ded3] pb-4">
                            <div>
                                <h2 className="m-0 text-xl font-semibold text-[#322d29]">
                                    {monthLabel(bill.billingMonth)}
                                </h2>
                                <p className="mt-1 text-xs text-[#8a8077]">
                                    Due {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${bill.dueDate}T00:00:00Z`))}
                                </p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusClass(bill.status)}`}>
                                {bill.status}
                            </span>
                        </div>

                        <div className="grid gap-4 py-5 text-sm">
                            <div className="flex justify-between gap-4 text-[#82766c]">
                                <span>Total bill</span>
                                <strong className="text-base text-[#322d29]">{money(bill.totalAmount)}</strong>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-[#e7ded3] pt-4">
                            <div>
                                <p className="m-0 text-xs text-[#8a8077]">Payments recorded</p>
                                <strong className="mt-1 block text-2xl font-semibold text-[#322d29]">
                                    {money(paid)}
                                </strong>
                            </div>
                            <div>
                                <p className="m-0 text-xs text-[#8a8077]">Outstanding balance</p>
                                <strong className="mt-1 block text-2xl font-semibold text-[#704b34]">
                                    {money(bill.outstandingBalance)}
                                </strong>
                            </div>
                        </div>
                    </section>

                    <section className="mt-5">
                        <h2 className="mb-3 text-base font-semibold text-[#322d29]">Recorded payments</h2>
                        <div className="panel flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="m-0 text-xs font-semibold uppercase text-[#8a8077]">Total received so far</p>
                                <p className="mb-0 mt-1 text-xs text-[#8a8077]">Payments already applied to this bill</p>
                            </div>
                            <strong className="text-lg text-[#322d29]">{money(paid)}</strong>
                        </div>
                        <p className="mt-3 text-[11px] text-[#8a8077]">
                            Linked bill: {billNumber(bill.billingMonth, bill.roomNumber)} · Saving a payment updates the outstanding balance.
                        </p>
                    </section>

                    <section className="mt-5">
                        <h2 className="mb-3 text-base font-semibold text-[#322d29]">Receipt images</h2>

                        {receiptsLoading ? (
                            <div className="panel text-sm text-[#8a8077]">Loading receipts…</div>
                        ) : receipts.some((receipt) => receipt.receiptUrl) ? (
                            <div className="panel grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {receipts.map(
                                    (receipt) =>
                                        receipt.receiptUrl && (
                                            <button
                                                key={receipt.submissionId}
                                                type="button"
                                                onClick={() => setPreviewUrl(receipt.receiptUrl)}
                                                className="group text-left"
                                                aria-label="View full receipt image"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={receipt.receiptUrl}
                                                    alt="Payment receipt"
                                                    className="h-40 w-full rounded-lg border border-[#e0d8cb] object-cover transition group-hover:opacity-90 group-hover:ring-2 group-hover:ring-[#704b34]/30"
                                                />
                                                <span className="mt-2 block text-[11px] font-semibold uppercase text-[#8a8077]">
                                                    {receipt.status} · {money(receipt.amount)}
                                                </span>
                                                {receipt.referenceNumber && (
                                                    <span className="block text-[11px] text-[#8a8077]">
                                                        Ref {receipt.referenceNumber}
                                                    </span>
                                                )}
                                            </button>
                                        ),
                                )}
                            </div>
                        ) : (
                            <div className="panel flex items-center gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#ece4d9] text-[10px] font-bold uppercase text-[#8a8077]">
                                    Image
                                </div>
                                <div>
                                    <p className="m-0 text-sm font-semibold text-[#322d29]">No receipt images yet</p>
                                    <p className="mb-0 mt-1 text-xs text-[#8a8077]">
                                        Receipt images linked to this bill will appear here.
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                <section className="panel">
                    <h2 className="m-0 text-lg font-semibold text-[#322d29]">Record a payment</h2>
                    <p className="mb-5 mt-1 text-xs text-[#8a8077]">Only record money already received.</p>

                    <div className="mb-4 rounded-lg bg-[#f7f3ee] p-3.5">
                        <p className="m-0 text-xs text-[#8a8077]">Linked bill · {billNumber(bill.billingMonth, bill.roomNumber)}</p>
                        <p className="mb-0 mt-1 text-sm font-semibold text-[#322d29]">
                            {bill.tenantName} · Room {bill.roomNumber ?? "—"}
                        </p>
                    </div>

                    <form className="grid gap-4" onSubmit={handleSubmit}>
                        <label className="block text-[13px] font-semibold text-[#322d29]">
                            Amount received
                            <input
                                className="mt-2 block h-11 w-full rounded-lg border border-[#e0d8cb] bg-white px-3 text-sm font-medium text-[#322d29] outline-none focus:border-[#704b34] focus:ring-2 focus:ring-[#704b34]/15 disabled:bg-[#f7f3ee]"
                                type="number"
                                min="0.01"
                                step="0.01"
                                max={bill.outstandingBalance}
                                value={amount}
                                onChange={(event) => setAmount(event.target.value)}
                                placeholder="₱ 0.00"
                                disabled={fullyPaid}
                                required
                            />
                            <span className="mt-2 block text-xs font-normal text-[#8a8077]">
                                {fullyPaid
                                    ? "This bill is fully paid."
                                    : `Maximum: ${money(bill.outstandingBalance)} outstanding`}
                            </span>
                        </label>

                        <label className="block text-[13px] font-semibold text-[#322d29]">
                            Payment date
                            <input
                                className="mt-2 block h-11 w-full rounded-lg border border-[#e0d8cb] bg-white px-3 text-sm font-medium text-[#322d29] outline-none focus:border-[#704b34] focus:ring-2 focus:ring-[#704b34]/15 disabled:bg-[#f7f3ee]"
                                type="date"
                                value={paymentDate}
                                max={manilaToday()}
                                onChange={(event) => setPaymentDate(event.target.value)}
                                disabled={fullyPaid}
                                required
                            />
                        </label>

                        <div className="border-t border-[#e7ded3] pt-4">
                            <div className="flex justify-between gap-3 text-sm text-[#8a8077]">
                                <span>Current balance</span>
                                <strong className="text-[#322d29]">{money(bill.outstandingBalance)}</strong>
                            </div>
                        </div>

                        <button
                            className="h-11 rounded-lg bg-[#60402d] px-4 text-sm font-semibold text-white transition hover:bg-[#4c3223] disabled:cursor-not-allowed disabled:opacity-60"
                            type="submit"
                            disabled={saving || loading || fullyPaid}
                        >
                            {saving ? "Recording…" : "✓  Save payment record"}
                        </button>
                        <Link
                            href={backHref}
                            className="flex h-11 items-center justify-center rounded-lg border border-[#e0d8cb] bg-white px-4 text-sm font-semibold text-[#60422f] hover:bg-[#f7f3ec]"
                        >
                            Cancel
                        </Link>
                        <p className="mb-0 text-[11px] leading-relaxed text-[#8a8077]">
                            This is an unsaved entry. The bill balance changes only after you save the payment record.
                        </p>
                    </form>
                </section>
            </div>

            {/* Full image pop-up */}
            {previewUrl && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Receipt image"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setPreviewUrl(null)}
                >
                    <div
                        className="relative max-h-full max-w-4xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            aria-label="Close image"
                            onClick={() => setPreviewUrl(null)}
                            className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-base font-semibold text-[#322d29] shadow-lg hover:bg-[#f7f3ec]"
                        >
                            ✕
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewUrl}
                            alt="Payment receipt, full size"
                            className="max-h-[85vh] w-auto max-w-full rounded-lg bg-white object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}