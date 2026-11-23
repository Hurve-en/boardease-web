"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { billNumber } from "@/lib/bill-math";
import {
    PAYMENTS_PATH,
    resolveMonth,
    money,
    statusClass,
    type Bill,
} from "@/lib/payment-ui";

const ROOM_GRID =
    "grid grid-cols-[1.1fr_1.4fr_1.3fr_1fr_0.9fr_0.8fr] items-center gap-4 px-6";

export default function PaymentRoomList({ initialMonth }: { initialMonth?: string }){
    const [month, setMonth] = useState(() => resolveMonth(initialMonth));
    const [reloadKey, setReloadKey] = useState(0);
    const [bills, setBills] = useState<Bill[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const filteredBills = useMemo(() => {
        const term = search.trim().toLowerCase();
        if(!term) return bills;
        return bills.filter(
            (bill) =>
                (bill.roomNumber ?? "").toLowerCase().includes(term) ||
                bill.tenantName.toLowerCase().includes(term),
        );
    }, [bills, search]);

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

                if(!cancelled) setBills(data.bills ?? []);
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
    }, [month, reloadKey]);

    return (
        <div className="dashboard-content">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="eyebrow">PAYMENTS</p>
                    <h1 className="m-0 text-3xl font-semibold tracking-tight text-[#322d29]">
                        Record a payment
                    </h1>
                    <p className="mt-2 text-sm text-[#8a8077]">
                        Choose a room to review its bill and record a payment.
                    </p>
                </div>
                <Link
                    href="/monthly-bills"
                    className="rounded-lg border border-[#e0d8cb] bg-white px-4 py-3 text-sm font-semibold text-[#60422f] hover:bg-[#f7f3ec]"
                >
                    ← Back to monthly bills
                </Link>
            </div>

            {error && (
                <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </p>
            )}

            <section className="overflow-hidden rounded-2xl border border-[#e7ded3] bg-white">
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                    <div>
                        <h2 className="m-0 text-lg font-medium text-[#322d29]">Room list</h2>
                        <p className="mb-0 mt-1 text-xs text-[#8a8077]">
                            Bills and balances for the selected month
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="month"
                            aria-label="Billing month"
                            value={month}
                            onChange={(event) => event.target.value && setMonth(event.target.value)}
                            className="h-9 rounded-lg border border-[#e0d8cb] bg-white px-3 text-xs font-medium text-[#60422f] outline-none focus:border-[#704b34]"
                        />
                        <div className="relative">
                            <svg
                                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a8077]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <circle cx="11" cy="11" r="7" />
                                <path d="m20 20-3.5-3.5" />
                            </svg>
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search rooms"
                                aria-label="Search rooms"
                                className="h-9 w-48 rounded-lg border border-[#e0d8cb] bg-white pl-9 pr-3 text-xs text-[#322d29] outline-none placeholder:text-[#a39a90] focus:border-[#704b34]"
                            />
                        </div>
                        <button
                            type="button"
                            aria-label="Refresh rooms"
                            onClick={() => setReloadKey((value) => value + 1)}
                            disabled={loading}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e0d8cb] bg-white text-[#60422f] hover:bg-[#f7f3ec] disabled:opacity-60"
                        >
                            <svg
                                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M21 12a9 9 0 0 0-15.5-6.2L3 8" />
                                <path d="M3 3v5h5" />
                                <path d="M3 12a9 9 0 0 0 15.5 6.2L21 16" />
                                <path d="M16 16h5v5" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-[760px]">
                        <div className={`${ROOM_GRID} bg-[#f4ede5] py-3 text-[10px] font-bold uppercase tracking-wider text-[#8a8077]`}>
                            <span>Room</span>
                            <span>Tenant</span>
                            <span>Bill no.</span>
                            <span>Balance</span>
                            <span>Status</span>
                            <span />
                        </div>

                        {loading ? (
                            <p className="m-0 px-6 py-8 text-center text-sm text-[#8a8077]">Loading rooms…</p>
                        ) : filteredBills.length === 0 ? (
                            <p className="m-0 px-6 py-8 text-center text-sm text-[#8a8077]">
                                {bills.length === 0
                                    ? "No bills for this month."
                                    : "No rooms match your search."}
                            </p>
                        ) : (
                            filteredBills.map((bill) => (
                                <Link
                                    key={bill.billId}
                                    href={`${PAYMENTS_PATH}/${bill.billId}?month=${month}`}
                                    className={`${ROOM_GRID} border-t border-[#efe7dc] bg-white py-4 text-sm transition hover:bg-[#fbf9f5]`}
                                >
                                    <span className="truncate font-semibold text-[#322d29]">
                                        {bill.roomNumber ?? "—"}
                                    </span>
                                    <span className="truncate font-semibold text-[#322d29]">
                                        {bill.tenantName}
                                    </span>
                                    <span className="truncate text-xs text-[#60422f]">
                                        {billNumber(bill.billingMonth, bill.roomNumber)}
                                    </span>
                                    <span className="text-xs text-[#322d29]">
                                        {money(bill.outstandingBalance)}
                                    </span>
                                    <span>
                                        <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold capitalize ${statusClass(bill.status)}`}>
                                            {bill.status}
                                        </span>
                                    </span>
                                    <span className="text-xs font-semibold text-[#60422f]">
                                        Open bill →
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}