"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { billNumber } from "@/lib/bill-math";
import {
    PAYMENTS_PATH,
    manilaToday,
    resolveMonth,
    money,
    monthLabel,
    dateTime,
    statusClass,
    submissionStatusClass,
    statusLabel,
    type Bill,
    type Receipt,
} from "@/lib/payment-ui";

function Detail({ label, children }: { label: string; children: ReactNode }){
    return (
        <div>
            <dt className="text-[12.5px] font-medium text-(--be-text-muted)">
                {label}
            </dt>
            <dd className="m-0 mt-1 text-sm text-(--be-text-primary)">{children}</dd>
        </div>
    );
}

function ReceiptDetails({ receipt }: { receipt: Receipt }){
    const submittedBy =
        `${receipt.tenantFirstName ?? ""} ${receipt.tenantLastName ?? ""}`.trim() || "—";

    return (
        <dl className="m-0 grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={submissionStatusClass(receipt.status)}>
                    {statusLabel(receipt.status)}
                </span>
                <strong className="text-xl text-(--be-text-primary)">{money(receipt.amount)}</strong>
            </div>

            <Detail label="Reference number">{receipt.referenceNumber || "—"}</Detail>
            <Detail label="Date submitted">{dateTime(receipt.submittedAt)}</Detail>
            <Detail label="Submitted by">{submittedBy}</Detail>

            {receipt.reviewedAt && (
                <Detail label="Date reviewed">{dateTime(receipt.reviewedAt)}</Detail>
            )}
            {receipt.reviewNote && (
                <Detail label="Review note">{receipt.reviewNote}</Detail>
            )}
        </dl>
    );
}

export default function PaymentDetail({
    billId,
    month: monthParam,
    proof,
}: {
    billId: string;
    month?: string;
    proof?: string;
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
    const [loadedReceiptsFor, setLoadedReceiptsFor] = useState("");
    const receiptsLoading = loadedReceiptsFor !== billId;
    const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);

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

    useEffect(() => {
        if (!loading && !receiptsLoading && proof && receipts.length) document.getElementById(`proof-${proof}`)?.scrollIntoView({block: "center"});
    }, [proof, loading, receiptsLoading, receipts]);

    // Load the submitted receipts for this bill.
    useEffect(() => {
        let cancelled = false;

        fetch(`/api/payment-submissions?billId=${billId}`, { cache: "no-store" })
            .then((res) => res.json())
            .then((data) => {
                if(!cancelled) setReceipts(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if(!cancelled) setReceipts([]);
            })
            .finally(() => {
                if(!cancelled) setLoadedReceiptsFor(billId);
            });

        return () => {
            cancelled = true;
        };
    }, [billId]);

    // Close the image pop-up with the Escape key.
    useEffect(() => {
        if(!previewReceipt) return;

        function onKeyDown(event: KeyboardEvent){
            if(event.key === "Escape") setPreviewReceipt(null);
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [previewReceipt]);

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
                <p className="text-sm text-(--be-text-muted)">Loading bill…</p>
            </div>
        );
    }

    if(!bill){
        return (
            <div className="dashboard-content">
                <section className="panel py-12 text-center">
                    <h2 className="m-0 text-lg font-semibold text-(--be-text-primary)">Bill not found</h2>
                    <p className="mb-5 mt-2 text-sm text-(--be-text-muted)">
                        {error || "This bill doesn't exist for the selected month."}
                    </p>
                    <Link
                        href={backHref}
                        className="rounded-lg border border-(--be-border-strong) bg-white px-4 py-3 text-sm font-semibold text-(--be-action-primary) hover:bg-(--be-surface-subtle)"
                    >
                        Back to payments
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
                    <h1 className="m-0 text-3xl font-semibold tracking-tight text-(--be-text-primary)">
                        Bill {billNumber(bill.billingMonth, bill.roomNumber)}
                    </h1>
                    <p className="mt-2 text-sm text-(--be-text-muted)">
                        {bill.tenantName}, Room {bill.roomNumber ?? "—"}, {monthLabel(bill.billingMonth)}
                    </p>
                </div>
                <Link
                    href={backHref}
                    className="rounded-lg border border-(--be-border-strong) bg-white px-4 py-3 text-sm font-semibold text-(--be-action-primary) hover:bg-(--be-surface-subtle)"
                >
                    Back to rooms
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
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-(--be-border-subtle) pb-4">
                            <div>
                                <h2 className="m-0 text-xl font-semibold text-(--be-text-primary)">
                                    {monthLabel(bill.billingMonth)}
                                </h2>
                                <p className="mt-1 text-xs text-(--be-text-muted)">
                                    Due {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${bill.dueDate}T00:00:00Z`))}
                                </p>
                            </div>
                            <span className={statusClass(bill.status)}>
                                {statusLabel(bill.status)}
                            </span>
                        </div>

                        <div className="grid gap-4 py-5 text-sm">
                            <div className="flex justify-between gap-4 text-(--be-text-muted)">
                                <span>Total bill</span>
                                <strong className="text-base text-(--be-text-primary)">{money(bill.totalAmount)}</strong>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-(--be-border-subtle) pt-4">
                            <div>
                                <p className="m-0 text-xs text-(--be-text-muted)">Payments recorded</p>
                                <strong className="mt-1 block text-2xl font-semibold text-(--be-text-primary)">
                                    {money(paid)}
                                </strong>
                            </div>
                            <div>
                                <p className="m-0 text-xs text-(--be-text-muted)">Outstanding balance</p>
                                <strong className="mt-1 block text-2xl font-semibold text-(--be-action-primary)">
                                    {money(bill.outstandingBalance)}
                                </strong>
                            </div>
                        </div>
                    </section>

                    <section className="mt-5">
                        <h2 className="mb-3 text-base font-semibold text-(--be-text-primary)">Recorded payments</h2>
                        <div className="panel flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="m-0 text-[12.5px] font-medium text-(--be-text-muted)">Total received so far</p>
                                <p className="mb-0 mt-1 text-xs text-(--be-text-muted)">Payments already applied to this bill</p>
                            </div>
                            <strong className="text-lg text-(--be-text-primary)">{money(paid)}</strong>
                        </div>
                        <p className="mt-3 text-[12.5px] text-(--be-text-muted)">
                            Linked to bill {billNumber(bill.billingMonth, bill.roomNumber)}. Saving a payment updates the outstanding balance.
                        </p>
                    </section>

                    <section className="mt-5">
                        <h2 className="mb-3 text-base font-semibold text-(--be-text-primary)">
                            Receipt images
                            {receipts.length > 0 && (
                                <span className="ml-2 text-xs font-normal text-(--be-text-muted)">
                                    {receipts.length} submitted
                                </span>
                            )}
                        </h2>

                        {receiptsLoading ? (
                            <div className="panel text-sm text-(--be-text-muted)">Loading receipts…</div>
                        ) : receipts.length > 0 ? (
                            <div className="grid gap-4">
                                {receipts.map((receipt) => (
                                    <article
                                        id={`proof-${receipt.submissionId}`}
                                        key={receipt.submissionId}
                                        className="panel flex flex-col gap-5 sm:flex-row"
                                    >
                                        {receipt.receiptUrl ? (
                                            <button
                                                type="button"
                                                onClick={() => setPreviewReceipt(receipt)}
                                                className="group relative block h-80 w-full shrink-0 overflow-hidden rounded-xl border border-(--be-border-strong) bg-(--be-surface-muted) sm:w-72"
                                                aria-label="View full receipt image"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={receipt.receiptUrl}
                                                    alt="Payment receipt"
                                                    className="h-full w-full object-contain"
                                                />
                                                <span className="absolute inset-x-0 bottom-0 bg-black/55 py-2 text-center text-[12.5px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                                                    Click to enlarge
                                                </span>
                                            </button>
                                        ) : (
                                            <div className="flex h-80 w-full shrink-0 items-center justify-center rounded-xl border border-dashed border-(--be-border-strong) bg-(--be-surface-muted) text-xs text-(--be-text-muted) sm:w-72">
                                                Image unavailable
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <ReceiptDetails receipt={receipt} />
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="panel flex items-center gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-(--be-border-subtle) text-[12px] font-bold uppercase text-(--be-text-muted)">
                                    Image
                                </div>
                                <div>
                                    <p className="m-0 text-sm font-semibold text-(--be-text-primary)">No receipt images yet</p>
                                    <p className="mb-0 mt-1 text-xs text-(--be-text-muted)">
                                        Receipt images linked to this bill will appear here.
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                <section className="panel">
                    <h2 className="m-0 text-lg font-semibold text-(--be-text-primary)">Record a payment</h2>
                    <p className="mb-5 mt-1 text-xs text-(--be-text-muted)">Only record money already received.</p>

                    <div className="mb-4 rounded-lg bg-(--be-surface-subtle) p-3.5">
                        <p className="m-0 text-xs text-(--be-text-muted)">Linked bill {billNumber(bill.billingMonth, bill.roomNumber)}</p>
                        <p className="mb-0 mt-1 text-sm font-semibold text-(--be-text-primary)">
                            {bill.tenantName}, Room {bill.roomNumber ?? "—"}
                        </p>
                    </div>

                    <form className="grid gap-4" onSubmit={handleSubmit}>
                        <label className="block text-[13px] font-semibold text-(--be-text-primary)">
                            Amount received
                            <input
                                className="mt-2 block h-11 w-full rounded-lg border border-(--be-border-strong) bg-white px-3 text-sm font-medium text-(--be-text-primary) outline-none focus:border-(--be-action-primary) focus:ring-2 focus:ring-(--be-action-primary)/15 disabled:bg-(--be-surface-subtle)"
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
                            <span className="mt-2 block text-xs font-normal text-(--be-text-muted)">
                                {fullyPaid
                                    ? "This bill is fully paid."
                                    : `Maximum: ${money(bill.outstandingBalance)} outstanding`}
                            </span>
                        </label>

                        <label className="block text-[13px] font-semibold text-(--be-text-primary)">
                            Payment date
                            <input
                                className="mt-2 block h-11 w-full rounded-lg border border-(--be-border-strong) bg-white px-3 text-sm font-medium text-(--be-text-primary) outline-none focus:border-(--be-action-primary) focus:ring-2 focus:ring-(--be-action-primary)/15 disabled:bg-(--be-surface-subtle)"
                                type="date"
                                value={paymentDate}
                                max={manilaToday()}
                                onChange={(event) => setPaymentDate(event.target.value)}
                                disabled={fullyPaid}
                                required
                            />
                        </label>

                        <div className="border-t border-(--be-border-subtle) pt-4">
                            <div className="flex justify-between gap-3 text-sm text-(--be-text-muted)">
                                <span>Current balance</span>
                                <strong className="text-(--be-text-primary)">{money(bill.outstandingBalance)}</strong>
                            </div>
                        </div>

                        <button
                            className="h-11 rounded-lg bg-(--be-action-primary) px-4 text-sm font-semibold text-white transition hover:bg-(--be-action-primary-hover) disabled:cursor-not-allowed disabled:opacity-60"
                            type="submit"
                            disabled={saving || loading || fullyPaid}
                        >
                            {saving ? "Recording…" : "✓  Save payment record"}
                        </button>
                        <Link
                            href={backHref}
                            className="flex h-11 items-center justify-center rounded-lg border border-(--be-border-strong) bg-white px-4 text-sm font-semibold text-(--be-action-primary) hover:bg-(--be-surface-subtle)"
                        >
                            Cancel
                        </Link>
                        <p className="mb-0 text-[12.5px] leading-relaxed text-(--be-text-muted)">
                            This is an unsaved entry. The bill balance changes only after you save the payment record.
                        </p>
                    </form>
                </section>
            </div>

            {/* Full receipt pop-up */}
            {previewReceipt?.receiptUrl && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Receipt details"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setPreviewReceipt(null)}
                >
                    <div
                        className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white lg:flex-row"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            aria-label="Close image"
                            onClick={() => setPreviewReceipt(null)}
                            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-base font-semibold text-(--be-text-primary) shadow-lg hover:bg-(--be-surface-subtle)"
                        >
                            ✕
                        </button>

                        <div className="flex min-h-0 flex-1 items-center justify-center bg-(--be-action-primary) p-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewReceipt.receiptUrl}
                                alt="Payment receipt, full size"
                                className="max-h-[80vh] w-auto max-w-full object-contain"
                            />
                        </div>

                        <aside className="w-full shrink-0 overflow-y-auto p-6 lg:w-80">
                            <h2 className="mb-5 mt-0 text-base font-semibold text-(--be-text-primary)">
                                Receipt details
                            </h2>
                            <ReceiptDetails receipt={previewReceipt} />
                        </aside>
                    </div>
                </div>
            )}
        </div>
    );
}