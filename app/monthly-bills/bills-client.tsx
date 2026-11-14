"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {
	ArrowRight,
	LoaderCircle,
	Plus,
	ReceiptText,
	RefreshCw,
	Search,
} from "lucide-react";
import {billNumber} from "@/lib/bill-math";

type BillStatus = "paid" | "partial" | "unpaid";
type Bill = {
	billId: string;
	tenantName: string;
	roomNumber: string | null;
	billingMonth: string; // "2026-10-01"
	totalAmount: string;
	outstandingBalance: string;
	dueDate: string; // "2026-10-10"
	status: BillStatus;
};
type Summary = {
	totalBilled: string;
	totalCollected: string;
	totalOutstanding: string;
};
type Filter = "all" | BillStatus;

const money = (value: string | number) =>
	new Intl.NumberFormat("en-PH", {style: "currency", currency: "PHP"}).format(
		Number(value) || 0,
	);

const shortDate = (iso: string) =>
	new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${iso}T00:00:00Z`));

const monthLabel = (month: string) =>
	new Intl.DateTimeFormat("en-GB", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${month}-01T00:00:00Z`));

const currentMonth = () =>
	new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Manila"})
		.format(new Date())
		.slice(0, 7);

const STATUS_STYLE: Record<BillStatus, string> = {
	unpaid: "bg-[#f7e4dd] text-[#9b3a2e]",
	partial: "bg-[#f9eeda] text-[#8a5a12]",
	paid: "bg-[#e4eedf] text-[#3d6b3a]",
};

export default function BillsClient() {
	const [month, setMonth] = useState(currentMonth);
	const [bills, setBills] = useState<Bill[]>([]);
	const [summary, setSummary] = useState<Summary>({
		totalBilled: "0",
		totalCollected: "0",
		totalOutstanding: "0",
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [filter, setFilter] = useState<Filter>("all");
	const [query, setQuery] = useState("");

	const loadBills = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const response = await fetch(`/api/bills?month=${month}`, {
				cache: "no-store",
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Unable to load bills.");
			setBills(data.bills ?? []);
			setSummary(
				data.summary ?? {
					totalBilled: "0",
					totalCollected: "0",
					totalOutstanding: "0",
				},
			);
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Unable to load bills.",
			);
		} finally {
			setLoading(false);
		}
	}, [month]);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			void loadBills();
		}, 0);
		return () => window.clearTimeout(timer);
	}, [loadBills]);

	const counts = useMemo(
		() => ({
			all: bills.length,
			unpaid: bills.filter((b) => b.status === "unpaid").length,
			partial: bills.filter((b) => b.status === "partial").length,
			paid: bills.filter((b) => b.status === "paid").length,
		}),
		[bills],
	);

	const visibleBills = useMemo(
		() =>
			bills.filter(
				(b) =>
					(filter === "all" || b.status === filter) &&
					`${b.tenantName} ${billNumber(b.billingMonth, b.roomNumber)}`
						.toLowerCase()
						.includes(query.toLowerCase()),
			),
		[bills, filter, query],
	);

	const earliestDue = bills.map((b) => b.dueDate).sort()[0];

	return (
		<div className="dashboard-content rooms-content">
			<section className="rooms-heading">
				<div>
					<p className="eyebrow">BILLING</p>
					<h1>Monthly bills</h1>
					<p className="welcome-copy">
						Rent, utilities and payment status — one monthly record.
					</p>
				</div>
				<Link className="create-action" href="/monthly-bills/new">
					<Plus size={16} /> Create monthly bill
				</Link>
			</section>

			{/* Month summary card */}
			<section className="panel flex flex-wrap items-center justify-between gap-6 p-6">
				<div>
					<h2 className="text-xl font-semibold text-[#2f2520]">
						{monthLabel(month)}
					</h2>
					<p className="mt-1 text-[13px] text-[#7d7269]">
						{bills.length} bill{bills.length === 1 ? "" : "s"} issued
						{earliestDue ? ` · Due ${shortDate(earliestDue)}` : ""}
					</p>
				</div>
				<div className="flex flex-wrap gap-10">
					<SummaryFigure
						label="Total billed"
						value={money(summary.totalBilled)}
					/>
					<SummaryFigure
						label="Collected"
						value={money(summary.totalCollected)}
					/>
					<SummaryFigure
						label="Outstanding"
						value={money(summary.totalOutstanding)}
					/>
				</div>
			</section>

			<div
				className="mt-5 flex flex-wrap gap-2"
				role="tablist"
				aria-label="Filter by status">
				{(["all", "unpaid", "partial", "paid"] as const).map((key) => (
					<button
						key={key}
						role="tab"
						aria-selected={filter === key}
						onClick={() => setFilter(key)}
						className={`h-[38px] rounded-lg border px-4 text-[13px] font-semibold transition ${
							filter === key
								? "border-[#5e3d2b] bg-[#5e3d2b] text-white"
								: "border-[#e0d8cb] bg-white text-[#4a3f38] hover:bg-[#f7f3ec]"
						}`}>
						{key === "all" ? "All bills" : key.toUpperCase()} · {counts[key]}
					</button>
				))}
			</div>

			<section className="room-list-panel panel mt-5">
				<div className="room-list-header">
					<label className="search-field">
						<Search size={15} />
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search tenant or bill number"
							aria-label="Search tenant or bill number"
						/>
					</label>
					<div className="room-tools">
						<input
							type="month"
							value={month}
							onChange={(event) =>
								event.target.value && setMonth(event.target.value)
							}
							aria-label="Billing month"
							className="h-[38px] rounded-lg border border-[#e0d8cb] bg-white px-3 text-[13px] font-semibold text-[#4a3f38]"
						/>
						<button
							className="refresh-button"
							onClick={() => void loadBills()}
							aria-label="Refresh bills">
							<RefreshCw size={15} />
						</button>
					</div>
				</div>

				{loading ? (
					<div className="room-state">
						<LoaderCircle className="spin" size={22} />
						<span>Loading bills…</span>
					</div>
				) : error ? (
					<div className="room-state">
						<strong>Couldn’t load bills</strong>
						<span>{error}</span>
						<button className="text-button" onClick={() => void loadBills()}>
							Try again
						</button>
					</div>
				) : visibleBills.length === 0 ? (
					<div className="room-state">
						<span className="empty-icon">
							<ReceiptText size={19} />
						</span>
						<strong>
							{bills.length === 0
								? `No bills for ${monthLabel(month)}`
								: "No bills match"}
						</strong>
						<span>
							{bills.length === 0
								? "Create a monthly bill to start tracking payments."
								: "Try another status, tenant or bill number."}
						</span>
					</div>
				) : (
					<div className="rooms-table-wrap">
						<table className="rooms-table">
							<thead>
								<tr>
									<th>Bill / tenant</th>
									<th>Room</th>
									<th>Total bill</th>
									<th>Outstanding</th>
									<th>Due date</th>
									<th>Status</th>
									<th>
										<span className="sr-only">Actions</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{visibleBills.map((bill) => (
									<tr key={bill.billId}>
										<td>
											<strong className="room-number">
												{billNumber(bill.billingMonth, bill.roomNumber)}
											</strong>
											<span className="block text-xs text-[#7d7269]">
												{bill.tenantName}
											</span>
										</td>
										<td>
											{bill.roomNumber ?? <span className="muted-cell">—</span>}
										</td>
										<td className="room-money">{money(bill.totalAmount)}</td>
										<td className="room-money">
											{money(bill.outstandingBalance)}
										</td>
										<td>{shortDate(bill.dueDate)}</td>
										<td>
											<span
												className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS_STYLE[bill.status]}`}>
												{bill.status.toUpperCase()}
											</span>
										</td>
										<td>
											<Link
												className="detail-button"
												href={`/monthly-bills/${bill.billId}`}>
												View bill <ArrowRight size={14} />
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			<p className="mt-4 text-xs text-[#7d7269]">
				Showing {visibleBills.length} of {bills.length} bills for{" "}
				{monthLabel(month)}
			</p>

			<section className="mt-5 grid gap-4 rounded-2xl bg-[#efe6dc] p-5 sm:grid-cols-3">
				<Legend status="unpaid" text="No payment recorded" />
				<Legend status="partial" text="Payment recorded; balance remains" />
				<Legend status="paid" text="Balance fully settled" />
			</section>
		</div>
	);
}

function SummaryFigure({label, value}: {label: string; value: string}) {
	return (
		<div>
			<span className="text-xs text-[#7d7269]">{label}</span>
			<strong className="mt-1 block text-2xl font-semibold text-[#2f2520]">
				{value}
			</strong>
		</div>
	);
}

function Legend({status, text}: {status: BillStatus; text: string}) {
	return (
		<div>
			<span
				className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS_STYLE[status]}`}>
				{status.toUpperCase()}
			</span>
			<p className="mt-2 text-[13px] text-[#5a4a3f]">{text}</p>
		</div>
	);
}
