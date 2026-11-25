import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeft, Info, Pencil} from "lucide-react";
import {z} from "zod";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import {verifyAdmin} from "@/lib/dal";
import {getBillDetails} from "@/lib/billing";
import {billNumber} from "@/lib/bill-math";

type BillStatus = "paid" | "partial" | "unpaid";

const money = (value: string | number) =>
	new Intl.NumberFormat("en-PH", {style: "currency", currency: "PHP"}).format(
		Number(value) || 0,
	);

const dateLabel = (iso: string) =>
	new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${iso}T00:00:00Z`));

const issuedLabel = (when: Date) =>
	new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		timeZone: "Asia/Manila",
	}).format(when);

const monthLabel = (iso: string) =>
	new Intl.DateTimeFormat("en-GB", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${iso}T00:00:00Z`));

export default async function BillDetailPage(
	props: PageProps<"/monthly-bills/[billId]">,
) {
	await verifyAdmin();

	const {billId} = await props.params;
	if (!z.uuid().safeParse(billId).success) notFound();

	const details = await getBillDetails(billId);
	if (!details) notFound();

	const {bill, payments} = details;
	const status = bill.status as BillStatus;
	const number = billNumber(bill.billingMonth, bill.roomNumber);
	const paidSoFar =
		payments.reduce((sum, p) => sum + Math.round(Number(p.amount) * 100), 0) /
		100;

	const perDay = new Map<string, number>();
	const paymentRows = payments.map((p) => {
		const n = (perDay.get(p.paymentDate) ?? 0) + 1;
		perDay.set(p.paymentDate, n);
		const code = `PAY-${p.paymentDate.slice(2, 4)}${p.paymentDate.slice(5, 7)}${p.paymentDate.slice(8, 10)}-${String(n).padStart(2, "0")}`;
		return {...p, code};
	});

	return (
		<DashboardShell section="MONTHLY BILLS">
			<main className="mx-auto w-full max-w-[1200px] flex-1 px-8 pb-12 pt-8">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h1 className="text-[32px] font-semibold tracking-tight text-(--be-text-primary)">
							Bill {number}
						</h1>
						<p className="mt-1 text-sm text-(--be-text-muted)">
							{bill.tenantName},{" "}
							{bill.roomNumber ? `Room ${bill.roomNumber}` : "No room"},{" "}
							{monthLabel(bill.billingMonth)}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Link
							href={`/monthly-bills/${bill.billId}/edit`}
							className="inline-flex h-[42px] items-center gap-2 rounded-lg bg-(--be-action-primary) px-4 text-[13px] font-semibold text-white! hover:bg-(--be-action-primary-hover)">
							<Pencil size={15} /> Edit bill
						</Link>
						<Link
							href="/monthly-bills"
							className="inline-flex h-[42px] items-center gap-2 rounded-lg border border-(--be-border-strong) bg-white px-4 text-[13px] font-semibold text-(--be-action-primary) hover:bg-(--be-surface-subtle)">
							<ArrowLeft size={15} /> Back to monthly bills
						</Link>
					</div>
				</div>

				<div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
					<div>
						<section className="rounded-2xl border border-(--be-border-subtle) bg-white p-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<h2 className="text-xl font-semibold text-(--be-text-primary)">
										{monthLabel(bill.billingMonth)}
									</h2>
									<p className="mt-1 text-xs text-(--be-text-muted)">
										Issued {issuedLabel(bill.createdAt)}, due{" "}
										{dateLabel(bill.dueDate)}
									</p>
								</div>
								<span
									className={`be-badge is-${status}`}>
									{status.charAt(0).toUpperCase() + status.slice(1)}
								</span>
							</div>

							<dl className="mt-5 space-y-4 border-t border-(--be-border-subtle) pt-5 text-[13px]">
								<Line label="Monthly rent" value={money(bill.rentAmount)} />
								<Line label="Electricity" value={money(bill.electricCharge)} />
								<Line label="Water" value={money(bill.waterCharge)} />
								<div className="flex items-baseline justify-between pt-1">
									<dt className="text-base text-(--be-text-secondary)">Total bill</dt>
									<dd className="text-2xl font-semibold text-(--be-text-primary)">
										{money(bill.totalAmount)}
									</dd>
								</div>
							</dl>

							<div className="mt-5 grid gap-4 border-t border-(--be-border-subtle) pt-5 sm:grid-cols-2">
								<div>
									<span className="text-xs text-(--be-text-muted)">
										Payments recorded
									</span>
									<strong className="mt-1 block text-2xl font-semibold text-(--be-text-primary)">
										{money(paidSoFar)}
									</strong>
								</div>
								<div>
									<span className="text-xs text-(--be-text-muted)">
										Outstanding balance
									</span>
									<strong className="mt-1 block text-2xl font-semibold text-(--be-action-primary)">
										{money(bill.outstandingBalance)}
									</strong>
								</div>
							</div>
						</section>

						{/* Recorded payments */}
						<h2 className="mt-7 text-base font-semibold text-(--be-text-primary)">
							Recorded payments
						</h2>
						<div className="mt-3 overflow-hidden rounded-2xl border border-(--be-border-subtle) bg-white">
							<table className="w-full text-left text-[13px]">
								<thead className="bg-(--be-surface-muted) text-[12.5px] font-semibold uppercase tracking-wide text-(--be-text-muted)">
									<tr>
										<th className="px-5 py-3">Payment / date</th>
										<th className="px-5 py-3">Amount</th>
										<th className="px-5 py-3">Recorded by</th>
									</tr>
								</thead>
								<tbody>
									{paymentRows.length === 0 ? (
										<tr>
											<td
												colSpan={3}
												className="px-5 py-6 text-center text-(--be-text-muted)">
												No payments recorded yet.
											</td>
										</tr>
									) : (
										paymentRows.map((p) => (
											<tr
												key={p.paymentId}
												className="border-t border-(--be-border-subtle)">
												<td className="px-5 py-3">
													<strong className="block text-(--be-text-primary)">
														{p.code}
													</strong>
													<span className="text-xs text-(--be-text-muted)">
														{dateLabel(p.paymentDate)}
													</span>
												</td>
												<td className="px-5 py-3 text-(--be-text-primary)">
													{money(p.amount)}
												</td>
												<td className="px-5 py-3 text-(--be-text-primary)">
													{p.recordedBy}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
						<p className="mt-3 text-xs text-(--be-text-muted)">
							Linked to bill {number}. Payments update the outstanding balance
							automatically.
						</p>
					</div>

					<aside>
						<p className="flex gap-3 rounded-2xl bg-(--be-surface-muted) p-4 text-xs leading-relaxed text-(--be-text-secondary)">
							<Info size={15} className="mt-0.5 shrink-0" />
							Recording payments is part of the Payments feature and will appear
							here.
						</p>
					</aside>
				</div>
			</main>
		</DashboardShell>
	);
}

function Line({label, value}: {label: string; value: string}) {
	return (
		<div className="flex items-center justify-between">
			<dt className="text-(--be-text-muted)">{label}</dt>
			<dd className="text-(--be-text-primary)">{value}</dd>
		</div>
	);
}
