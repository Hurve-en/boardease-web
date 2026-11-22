"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { billNumber } from "@/lib/bill-math";

type Bill = {
    billId: string;
    tenantName: string;
    roomNumber: string | null;
    billingMonth: string;
    totalAmount: string;
    outstandingBalance: string;
    dueDate: string;
    status: "paid" | "partial" | "unpaid";
};

function manilaToday(){
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
    }).format(new Date());
}

function currentMonth(){
    return manilaToday().slice(0, 7);
}

const money = (value: string | number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
        Number(value) || 0,
    );

const monthLabel = (value: string) =>
    new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${value.slice(0, 7)}-01T00:00:00Z`));

export default function RecordPaymentForm(){
    const [month, setMonth] = useState(currentMonth);
    const [bills, setBills] = useState<Bill[]>([]);
    const [billId, setBillId] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState(manilaToday);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const selectedBill = useMemo(
        () => bills.find((bill) => bill.billId === billId),
        [bills, billId],
    );

    useEffect(() => {
        let cancelled = false;

        async function loadBills(){
            setLoading(true);
            setError("");

            try{
                const response = await fetch(`/api/bills?month=${month}`, {
                    cache: "no-store",
                });
                const data = await response.json();

                if(!response.ok){
                    throw new Error(data.error || "Could not load bills.");
                }

                if(!cancelled){
                    setBills(data.bills ?? []);
                    setBillId("");
                }
            }catch(cause){
                if(!cancelled){
                    setError(
                        cause instanceof Error ? cause.message : "Could not load bills.",
                    );
                }
            }finally{
                if(!cancelled) setLoading(false);
            }
        }

        void loadBills();
        return () => {
            cancelled = true;
        };
    }, [month]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>){
        event.preventDefault();
        setError("");
        setSuccess("");

        const amountInCents = Math.round(Number(amount) * 100);
        const balanceInCents = Math.round(
            Number(selectedBill?.outstandingBalance ?? 0) * 100,
        );

        if(!selectedBill){
            setError("Select a bill.");
            return;
        }
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
                    billId: selectedBill.billId,
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
            setBillId("");
            // Refresh the bill list so its balance and status are current.
            setMonth((value) => value);
        } catch (cause) {
            setError(
                cause instanceof Error ? cause.message : "Could not record payment.",
            );
        }finally{
            setSaving(false);
        }
    }

    return (
        <div className="dashboard-content">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="eyebrow">PAYMENTS</p>
                    <h1 className="m-0 text-3xl font-semibold tracking-tight text-[#322d29]">
                        {selectedBill
                            ? `Bill ${billNumber(selectedBill.billingMonth, selectedBill.roomNumber)}`
                            : "Record a payment"}
                    </h1>
                    <p className="mt-2 text-sm text-[#8a8077]">
                        {selectedBill
                            ? `${selectedBill.tenantName} · Room ${selectedBill.roomNumber ?? "—"} · ${monthLabel(selectedBill.billingMonth)}`
                            : "Choose a room to review its bill and record a payment."}
                    </p>
                </div>
                <Link
                    href="/monthly-bills"
                    className="rounded-lg border border-[#e0d8cb] bg-white px-4 py-3 text-sm font-semibold text-[#60422f] hover:bg-[#f7f3ec]"
                >
                    ← Back to monthly bills
                </Link>
            </div>

            <section className="panel mb-5 flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-64 flex-1">
                    <label htmlFor="payment-room" className="block text-sm font-semibold text-[#322d29]">
                        Select a room
                    </label>
                    <p className="mt-1 text-xs text-[#8a8077]">
                        Pick a room to show its bill and payment form.
                    </p>
                    <select
                        id="payment-room"
                        className="mt-3 block h-11 w-full rounded-lg border border-[#e0d8cb] bg-white px-3 text-sm text-[#322d29] outline-none focus:border-[#704b34] focus:ring-2 focus:ring-[#704b34]/15"
                        value={billId}
                        onChange={(event) => setBillId(event.target.value)}
                        disabled={loading}
                    >
                        <option value="">
                            {loading ? "Loading rooms…" : "Choose a room"}
                        </option>
                        {bills.map((bill) => (
                            <option key={bill.billId} value={bill.billId}>
                                Room {bill.roomNumber ?? "—"} · {bill.tenantName} · {billNumber(bill.billingMonth, bill.roomNumber)}
                            </option>
                        ))}
                    </select>
                </div>
                <label className="block text-sm font-semibold text-[#322d29]">
                    Billing month
                    <input
                        className="mt-2 block h-11 rounded-lg border border-[#e0d8cb] bg-white px-3 text-sm font-medium text-[#60422f] outline-none focus:border-[#704b34]"
                        type="month"
                        value={month}
                        onChange={(event) => event.target.value && setMonth(event.target.value)}
                    />
                </label>
            </section>

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

            {selectedBill ? (
                <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_390px]">
                    <div className="min-w-0">
                        <section className="panel">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e7ded3] pb-4">
                                <div>
                                    <h2 className="m-0 text-xl font-semibold text-[#322d29]">
                                        {monthLabel(selectedBill.billingMonth)}
                                    </h2>
                                    <p className="mt-1 text-xs text-[#8a8077]">
                                        Due {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${selectedBill.dueDate}T00:00:00Z`))}
                                    </p>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${selectedBill.status === "paid" ? "bg-[#e4eedf] text-[#3d6b3a]" : selectedBill.status === "partial" ? "bg-[#f9eeda] text-[#8a5a12]" : "bg-[#f7e4dd] text-[#9b3a2e]"}`}>
                                    {selectedBill.status}
                                </span>
                            </div>

                            <div className="grid gap-4 py-5 text-sm">
                                <div className="flex justify-between gap-4 text-[#82766c]">
                                    <span>Total bill</span>
                                    <strong className="text-base text-[#322d29]">{money(selectedBill.totalAmount)}</strong>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-[#e7ded3] pt-4">
                                <div>
                                    <p className="m-0 text-xs text-[#8a8077]">Payments recorded</p>
                                    <strong className="mt-1 block text-2xl font-semibold text-[#322d29]">
                                        {money(Number(selectedBill.totalAmount) - Number(selectedBill.outstandingBalance))}
                                    </strong>
                                </div>
                                <div>
                                    <p className="m-0 text-xs text-[#8a8077]">Outstanding balance</p>
                                    <strong className="mt-1 block text-2xl font-semibold text-[#704b34]">
                                        {money(selectedBill.outstandingBalance)}
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
                                <strong className="text-lg text-[#322d29]">
                                    {money(Number(selectedBill.totalAmount) - Number(selectedBill.outstandingBalance))}
                                </strong>
                            </div>
                            <p className="mt-3 text-[11px] text-[#8a8077]">
                                Linked bill: {billNumber(selectedBill.billingMonth, selectedBill.roomNumber)} · Saving a payment updates the outstanding balance.
                            </p>
                        </section>
                    </div>

                    <section className="panel">
                        <h2 className="m-0 text-lg font-semibold text-[#322d29]">Record a payment</h2>
                        <p className="mb-5 mt-1 text-xs text-[#8a8077]">Only record money already received.</p>

                        <div className="mb-4 rounded-lg bg-[#f7f3ee] p-3.5">
                            <p className="m-0 text-xs text-[#8a8077]">Linked bill · {billNumber(selectedBill.billingMonth, selectedBill.roomNumber)}</p>
                            <p className="mb-0 mt-1 text-sm font-semibold text-[#322d29]">
                                {selectedBill.tenantName} · Room {selectedBill.roomNumber ?? "—"}
                            </p>
                        </div>

                        <form className="grid gap-4" onSubmit={handleSubmit}>
                            <label className="block text-[13px] font-semibold text-[#322d29]">
                                Amount received
                                <input
                                    className="mt-2 block h-11 w-full rounded-lg border border-[#e0d8cb] bg-white px-3 text-sm font-medium text-[#322d29] outline-none focus:border-[#704b34] focus:ring-2 focus:ring-[#704b34]/15"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    max={selectedBill.outstandingBalance}
                                    value={amount}
                                    onChange={(event) => setAmount(event.target.value)}
                                    placeholder="₱ 0.00"
                                    required
                                />
                                <span className="mt-2 block text-xs font-normal text-[#8a8077]">
                                    Maximum: {money(selectedBill.outstandingBalance)} outstanding
                                </span>
                            </label>

                            <label className="block text-[13px] font-semibold text-[#322d29]">
                                Payment date
                                <input
                                    className="mt-2 block h-11 w-full rounded-lg border border-[#e0d8cb] bg-white px-3 text-sm font-medium text-[#322d29] outline-none focus:border-[#704b34] focus:ring-2 focus:ring-[#704b34]/15"
                                    type="date"
                                    value={paymentDate}
                                    max={manilaToday()}
                                    onChange={(event) => setPaymentDate(event.target.value)}
                                    required
                                />
                            </label>

                            <div className="border-t border-[#e7ded3] pt-4">
                                <div className="flex justify-between gap-3 text-sm text-[#8a8077]">
                                    <span>Current balance</span>
                                    <strong className="text-[#322d29]">{money(selectedBill.outstandingBalance)}</strong>
                                </div>
                            </div>

                            <button
                                className="h-11 rounded-lg bg-[#60402d] px-4 text-sm font-semibold text-white transition hover:bg-[#4c3223] disabled:cursor-not-allowed disabled:opacity-60"
                                type="submit"
                                disabled={saving || loading || bills.length === 0}
                            >
                                {saving ? "Recording…" : "✓  Save payment record"}
                            </button>
                            <button
                                className="h-11 rounded-lg border border-[#e0d8cb] bg-white px-4 text-sm font-semibold text-[#60422f] hover:bg-[#f7f3ec]"
                                type="button"
                                onClick={() => setBillId("")}
                            >
                                Cancel
                            </button>
                            <p className="mb-0 text-[11px] leading-relaxed text-[#8a8077]">
                                This is an unsaved entry. The bill balance changes only after you save the payment record.
                            </p>
                        </form>
                    </section>
                </div>
            ) : (
                <section className="panel py-12 text-center">
                    <h2 className="m-0 text-lg font-semibold text-[#322d29]">
                        {loading ? "Loading rooms…" : "Select a room to continue"}
                    </h2>
                    <p className="mb-0 mt-2 text-sm text-[#8a8077]">
                        The bill summary and payment form will appear here after you choose a room.
                    </p>
                </section>
            )}
        </div>
    );
}
