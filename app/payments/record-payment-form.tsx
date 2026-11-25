"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw, Search } from "lucide-react";
import { billNumber } from "@/lib/bill-math";
import {
    PAYMENTS_PATH,
    resolveMonth,
    money,
    statusClass,
    statusLabel,
    type Bill,
} from "@/lib/payment-ui";

export default function PaymentRoomList({ initialMonth }: { initialMonth?: string }){
    const month = resolveMonth(initialMonth);
    const [reloadKey, setReloadKey] = useState(0);
    const [bills, setBills] = useState<Bill[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const openBills = useMemo(() => {
        const term = search.trim().toLowerCase();
        return bills
            .filter((bill) => Number(bill.outstandingBalance) > 0)
            .filter(
                (bill) =>
                    !term ||
                    (bill.roomNumber ?? "").toLowerCase().includes(term) ||
                    bill.tenantName.toLowerCase().includes(term),
            )
            .sort((a, b) => Number(b.outstandingBalance) - Number(a.outstandingBalance));
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

    const hasBills = bills.length > 0;

    return (
        <section className="room-list-panel panel" aria-labelledby="record-payment-title">
            <div className="room-list-header">
                <div>
                    <h2 id="record-payment-title">Record a payment</h2>
                </div>
                <div className="room-tools">
                    <label className="search-field">
                        <Search size={15} aria-hidden="true" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search tenant or room"
                            aria-label="Search bills with a balance"
                        />
                    </label>
                    <button
                        type="button"
                        className="drawer-close"
                        aria-label="Refresh bills"
                        onClick={() => setReloadKey((value) => value + 1)}
                        disabled={loading}
                    >
                        <RefreshCw size={15} className={loading ? "spin" : ""} aria-hidden="true" />
                    </button>
                </div>
            </div>

            {error && (
                <p role="alert" className="payments-error">
                    {error}
                </p>
            )}

            <div className="rooms-table-wrap">
                <table className="rooms-table">
                    <thead>
                        <tr>
                            <th>Tenant</th>
                            <th>Room</th>
                            <th>Bill no.</th>
                            <th>Balance</th>
                            <th>Status</th>
                            <th aria-label="Action" />
                        </tr>
                    </thead>
                    <tbody>
                        {loading && !hasBills ? (
                            <tr>
                                <td colSpan={6} className="payments-empty">Loading bills…</td>
                            </tr>
                        ) : openBills.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="payments-empty">
                                    {!hasBills
                                        ? "No bills for this month yet."
                                        : search
                                            ? "No bills with a balance match your search."
                                            : "Every bill this month is settled."}
                                </td>
                            </tr>
                        ) : (
                            openBills.map((bill) => (
                                <tr key={bill.billId}>
                                    <td className="tenant-name">{bill.tenantName}</td>
                                    <td className="muted-cell">{bill.roomNumber ?? "None"}</td>
                                    <td className="muted-cell">{billNumber(bill.billingMonth, bill.roomNumber)}</td>
                                    <td className="room-money">{money(bill.outstandingBalance)}</td>
                                    <td>
                                        <span className={statusClass(bill.status)}>{statusLabel(bill.status)}</span>
                                    </td>
                                    <td>
                                        <Link
                                            className="text-button"
                                            href={`${PAYMENTS_PATH}/${bill.billId}?month=${month}`}
                                        >
                                            Record payment <ArrowRight size={14} aria-hidden="true" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
