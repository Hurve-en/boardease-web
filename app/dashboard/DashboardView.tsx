import type { DashboardData } from "@/lib/dashboard";
import {
	ChartColumn,
	ChartPie,
	CircleAlert,
	Clock3,
	DoorOpen,
	FilePlus2,
	HandCoins,
	Info,
	Receipt,
	Wallet,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import MonthPicker from "@/app/components/MonthPicker";
import styles from "./dashboard.module.css";

const TIME_ZONE = "Asia/Manila";

const amount = (value: string | number) =>
	new Intl.NumberFormat("en-PH", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(value) || 0);

const peso = (value: string | number) => `₱${amount(value)}`;

function Money({ value }: { value: string | number }) {
	return (
		<>
			<small>₱</small>
			{amount(value)}
		</>
	);
}

const fromDateOnly = (value: string) => new Date(`${value}T00:00:00+08:00`);

const monthLabel = (value: string) =>
	new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: TIME_ZONE }).format(
		fromDateOnly(value),
	);

const shortMonthLabel = (value: string) =>
	new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: TIME_ZONE }).format(
		fromDateOnly(value),
	);

const dayLabel = (value: string) =>
	new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: TIME_ZONE }).format(
		fromDateOnly(value),
	);

const initials = (name: string) =>
	name
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

const firstName = (name: string) => name.split(" ")[0] ?? name;

const percent = (part: number, whole: number) => (whole > 0 ? Math.min(100, (part / whole) * 100) : 0);

const STATUS_LABEL = { paid: "Paid", partial: "Partial", unpaid: "Unpaid" } as const;


function CardTitle({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
	return (
		<div className={styles.cardTitle}>
			<Icon size={15} strokeWidth={1.8} aria-hidden="true" />
			<h2>{children}</h2>
		</div>
	);
}

function StatCard({
	icon,
	label,
	hint,
	children,
}: {
	icon: LucideIcon;
	label: string;
	hint: string;
	children: React.ReactNode;
}) {
	return (
		<article className={styles.card}>
			<div className={styles.cardHeader}>
				<CardTitle icon={icon}>{label}</CardTitle>
				<span className={styles.hint} tabIndex={0} role="img" aria-label={hint} title={hint}>
					<Info size={14} aria-hidden="true" />
				</span>
			</div>
			<div className={styles.statFigure}>{children}</div>
		</article>
	);
}


const MAX_STACK = 80;
const SEGMENT_GAP = 2.2;
const BAR_FRAC = 0.5;

const LAYERS = [
	{ key: "rent", label: "Rent", className: styles.layerRent, bandClass: styles.bandRent },
	{ key: "electric", label: "Electricity", className: styles.layerElectric, bandClass: styles.bandElectric },
	{ key: "water", label: "Water", className: styles.layerWater, bandClass: styles.bandWater },
] as const;

type LayerKey = (typeof LAYERS)[number]["key"];
type Span = [top: number, bottom: number];

function bandPath(x1: number, a: Span, x2: number, b: Span) {
	const mid = (x1 + x2) / 2;
	return [
		`M ${x1} ${a[0]}`,
		`C ${mid} ${a[0]}, ${mid} ${b[0]}, ${x2} ${b[0]}`,
		`L ${x2} ${b[1]}`,
		`C ${mid} ${b[1]}, ${mid} ${a[1]}, ${x1} ${a[1]}`,
		"Z",
	].join(" ");
}

function ChargesChart({ ledger }: { ledger: DashboardData["ledger"] }) {
	if (ledger.length === 0) {
		return (
			<div className={`${styles.empty} ${styles.chartEmpty}`}>
				<strong>No bills this month yet</strong>
				<span>Each tenant&apos;s bill will appear here once it&apos;s created.</span>
			</div>
		);
	}

	const max = Math.max(...ledger.map((bill) => Number(bill.totalAmount) || 0), 1);
	const count = ledger.length;

	const columns = ledger.map((bill) => {
		const values: Record<LayerKey, number> = {
			rent: Number(bill.rentAmount) || 0,
			electric: Number(bill.electricCharge) || 0,
			water: Number(bill.waterCharge) || 0,
		};
		let cursor = 100;
		const spans = {} as Record<LayerKey, Span | null>;
		for (const layer of LAYERS) {
			const value = values[layer.key];
			if (value <= 0) {
				spans[layer.key] = null;
				continue;
			}
			const height = Math.max((value / max) * MAX_STACK, 1.6);
			spans[layer.key] = [cursor - height, cursor];
			cursor -= height + SEGMENT_GAP;
		}
		return { bill, values, spans, top: cursor + SEGMENT_GAP, total: Number(bill.totalAmount) || 0 };
	});

	const left = (i: number) => ((i + (1 - BAR_FRAC) / 2) / count) * 100;
	const right = (i: number) => ((i + (1 + BAR_FRAC) / 2) / count) * 100;

	const bands: { key: string; d: string; className: string }[] = [];
	for (let i = 0; i < count - 1; i++) {
		for (const layer of LAYERS) {
			const a = columns[i].spans[layer.key];
			const b = columns[i + 1].spans[layer.key];
			if (!a && !b) continue;
			const from: Span = a ?? [b![1], b![1]];
			const to: Span = b ?? [a![1], a![1]];
			bands.push({ key: `${i}-${layer.key}`, className: layer.bandClass, d: bandPath(right(i), from, left(i + 1), to) });
		}
	}

	const grid = { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` };
	const barBox = { left: `${((1 - BAR_FRAC) / 2) * 100}%`, width: `${BAR_FRAC * 100}%` };

	return (
		<div className={styles.chartArea}>
			<div className={styles.chartScroll}>
				<div className={styles.chartInner} style={{ minWidth: count * 58, maxWidth: count * 150 }}>
					<div className={styles.plot}>
						<svg className={styles.bands} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
							{bands.map((band) => (
								<path key={band.key} d={band.d} className={band.className} />
							))}
						</svg>
						<div className={styles.columns} style={grid}>
							{columns.map(({ bill, values, spans, top, total }) => (
								<div
									key={bill.billId}
									className={styles.column}
									role="img"
									tabIndex={0}
									aria-label={`${bill.tenantName}, ${bill.roomNumber ? `room ${bill.roomNumber}` : "no room"}: ${peso(total)} billed. Rent ${peso(values.rent)}, electricity ${peso(values.electric)}, water ${peso(values.water)}.`}
								>
									<span className={styles.tooltip} aria-hidden="true">
										<strong>{bill.tenantName}</strong>
										{bill.roomNumber ? `Room ${bill.roomNumber}` : "No room assigned"}
										<br />
										Rent {peso(values.rent)}
										<br />
										Electricity {peso(values.electric)}
										<br />
										Water {peso(values.water)}
									</span>
									<span className={styles.barValue} style={{ bottom: `calc(${100 - top}% + 6px)` }}>
										{peso(total)}
									</span>
									{LAYERS.map((layer) => {
										const span = spans[layer.key];
										return span ? (
											<span
												key={layer.key}
												className={`${styles.segment} ${layer.className}`}
												style={{ ...barBox, top: `${span[0]}%`, height: `${span[1] - span[0]}%` }}
											/>
										) : null;
									})}
								</div>
							))}
						</div>
					</div>
					<div className={styles.columnLabels} style={grid}>
						{columns.map(({ bill }) => (
							<span key={bill.billId} title={bill.roomNumber ? `${bill.tenantName}, Room ${bill.roomNumber}` : bill.tenantName}>
								{firstName(bill.tenantName)}
							</span>
						))}
					</div>
				</div>
			</div>
			<div className={styles.chartLegend} aria-hidden="true">
				{LAYERS.map((layer) => (
					<span key={layer.key}>
						<i className={`${styles.swatch} ${layer.className}`} />
						{layer.label}
					</span>
				))}
			</div>
		</div>
	);
}


const PAY_MAX = 82;

function PaymentBars({ payments }: { payments: DashboardData["recentPayments"] }) {
	if (payments.length === 0) {
		return (
			<div className={`${styles.empty} ${styles.payEmpty}`}>
				<strong>No payments recorded yet</strong>
				<span>Payments will show here as you record them.</span>
			</div>
		);
	}

	const ordered = [...payments].reverse();
	const max = Math.max(...ordered.map((payment) => Number(payment.amount) || 0), 1);
	const latest = ordered.length - 1;

	return (
		<div className={styles.payChart} style={{ gridTemplateColumns: `repeat(${ordered.length}, minmax(0, 1fr))` }}>
			{ordered.map((payment, index) => {
				const value = Number(payment.amount) || 0;
				const isLatest = index === latest;
				const height = Math.max((value / max) * PAY_MAX, 3);
				return (
					<div
						key={payment.paymentId}
						className={`${styles.payColumn} ${isLatest ? styles.payLatest : ""}`}
						role="img"
						tabIndex={0}
						aria-label={`${payment.tenantName} paid ${peso(value)} on ${dayLabel(payment.paymentDate)} for the ${shortMonthLabel(payment.billingMonth)} bill${isLatest ? ", latest payment" : ""}`}
					>
						<span className={styles.tooltip} aria-hidden="true">
							<strong>{payment.tenantName}</strong>
							{peso(value)} on {dayLabel(payment.paymentDate)}
							<br />
							For the {shortMonthLabel(payment.billingMonth)} bill
						</span>
						<div className={styles.payArea}>
							{isLatest && (
								<span className={styles.payValue} style={{ bottom: `calc(${height}% + 6px)` }}>
									{peso(value)}
								</span>
							)}
							<span className={styles.payBar} style={{ height: `${height}%` }} />
						</div>
						<span className={styles.payLabel}>{firstName(payment.tenantName)}</span>
					</div>
				);
			})}
		</div>
	);
}


const PARTIAL_HATCH_ID = "dashboard-partial-hatch";

function StatusGauge({ paid, partial, unpaid }: { paid: number; partial: number; unpaid: number }) {
	const total = paid + partial + unpaid;
	const parts = [
		{ key: "paid", label: "paid", value: paid, color: "var(--be-success-text)" },
		{ key: "partial", label: "partial", value: partial, color: `url(#${PARTIAL_HATCH_ID})` },
		{ key: "unpaid", label: "unpaid", value: unpaid, color: "var(--be-danger-text)" },
	].filter((part) => part.value > 0);

	const gap = parts.length > 1 ? 1 : 0;
	const usable = 100 - gap * (parts.length - 1);
	let start = 0;
	const arc = "M 26 110 A 84 84 0 0 1 194 110";

	return (
		<div className={styles.gauge} role="img" aria-label={`${paid} paid, ${partial} partial and ${unpaid} unpaid bills`}>
			<svg viewBox="0 0 220 116" aria-hidden="true">
				<defs>
					<pattern id={PARTIAL_HATCH_ID} patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
						<rect width="5" height="5" fill="var(--be-warning-text)" />
						<rect width="1.6" height="5" fill="var(--be-warning-surface)" />
					</pattern>
				</defs>
				<path d={arc} fill="none" stroke="var(--be-surface-subtle)" strokeWidth="34" pathLength={100} />
				{total > 0 &&
					parts.map((part) => {
						const length = (part.value / total) * usable;
						const segment = (
							<path
								key={part.key}
								d={arc}
								fill="none"
								stroke={part.color}
								strokeWidth="34"
								pathLength={100}
								strokeDasharray={`${length} 100`}
								strokeDashoffset={-start}
							>
								<title>{`${part.value} ${part.label}`}</title>
							</path>
						);
						start += length + gap;
						return segment;
					})}
			</svg>
			<div className={styles.gaugeCenter}>
				{total > 0 ? (
					<>
						<strong>
							{paid}
							<span> / {total}</span>
						</strong>
						<span>fully paid</span>
					</>
				) : (
					<span>No bills yet</span>
				)}
			</div>
		</div>
	);
}


type DashboardViewProps = {
	data: DashboardData;
	displayName: string;
};

export default function DashboardView({ data, displayName }: DashboardViewProps) {
	const { billing, rooms, overdue, recentPayments, ledger } = data;
	const currentMonth = monthLabel(billing.month);

	const billCount = billing.paidCount + billing.partialCount + billing.unpaidCount;
	const hasBills = billCount > 0;
	const openBills = billing.partialCount + billing.unpaidCount;
	const collectionRate = percent(Number(billing.totalCollected), Number(billing.totalBilled));
	const occupancyRate = percent(rooms.occupied, rooms.total);
	const latestPayment = recentPayments[0];
	const byBalance = [...ledger].sort((a, b) => Number(b.outstandingBalance) - Number(a.outstandingBalance));

	return (
		<div className={styles.page}>
				<header className={styles.header}>
					<div>
						<h1>Dashboard</h1>
						<p className={styles.srOnly}>
							Signed in as {displayName}. Showing Maple House for {currentMonth}.
						</p>
					</div>
					<div className={styles.headerActions}>
						<MonthPicker month={billing.month.slice(0, 7)} />
						<Link className={styles.primaryButton} href="/monthly-bills/new">
							<FilePlus2 size={14} aria-hidden="true" />
							Create monthly bill
						</Link>
					</div>
				</header>

				<section className={styles.statGrid} aria-label="Monthly overview">
					<StatCard icon={Receipt} label="Total billed" hint="Sum of every bill issued for this month">
						<span className={styles.figure}>
							<Money value={billing.totalBilled} />
						</span>
						<span className={`${styles.pill} ${styles.pillNeutral}`}>
							{billCount} {billCount === 1 ? "bill" : "bills"}
						</span>
					</StatCard>

					<StatCard icon={Wallet} label="Collected" hint="Payments recorded against this month's bills">
						<span className={styles.figure}>
							<Money value={billing.totalCollected} />
						</span>
						{hasBills && (
							<span className={`${styles.pill} ${collectionRate >= 100 ? styles.pillSuccess : styles.pillNeutral}`}>
								{collectionRate.toFixed(1)}%
							</span>
						)}
					</StatCard>

					<StatCard icon={Clock3} label="Outstanding" hint="What tenants still owe on this month's bills">
						<span className={styles.figure}>
							<Money value={billing.totalOutstanding} />
						</span>
						{hasBills && (
							<span className={`${styles.pill} ${openBills ? styles.pillDanger : styles.pillSuccess}`}>
								{openBills ? `${openBills} open` : "Settled"}
							</span>
						)}
					</StatCard>

					<StatCard icon={DoorOpen} label="Room occupancy" hint="Rooms with an active tenant assignment">
						<span className={styles.figure}>
							{rooms.occupied}
							<small> / {rooms.total} rooms</small>
						</span>
						{rooms.total > 0 && (
							<span className={`${styles.pill} ${styles.pillNeutral}`}>{Math.round(occupancyRate)}%</span>
						)}
					</StatCard>
				</section>

				<section className={styles.rowWide}>
					<article className={styles.card}>
						<div className={styles.cardHeader}>
							<CardTitle icon={ChartColumn}>Billing overview</CardTitle>
							<span className={styles.cardMeta}>{currentMonth}</span>
						</div>
						{hasBills && (
							<>
								<p className={`${styles.figure} ${styles.figureLarge}`}>
									<Money value={billing.totalBilled} />
								</p>
								<p className={styles.figureMeta}>
									<span className={`${styles.pill} ${collectionRate >= 100 ? styles.pillSuccess : styles.pillNeutral}`}>
										{collectionRate.toFixed(1)}% collected
									</span>
									{peso(billing.totalCollected)} received so far
								</p>
							</>
						)}
						<ChargesChart ledger={ledger} />
					</article>

					<article className={styles.card}>
						<div className={styles.cardHeader}>
							<CardTitle icon={HandCoins}>Recent payments</CardTitle>
							<Link className={styles.textLink} href="/payments">
								See all
							</Link>
						</div>
						{latestPayment && (
							<>
								<p className={`${styles.figure} ${styles.figureLarge}`}>
									<Money value={latestPayment.amount} />
								</p>
								<p className={styles.figureMeta}>
									<span className={`${styles.pill} ${styles.pillSuccess}`}>Latest</span>
									from {latestPayment.tenantName} on {dayLabel(latestPayment.paymentDate)}
								</p>
							</>
						)}
						<PaymentBars payments={recentPayments} />
					</article>
				</section>

				<section className={styles.rowWideRight}>
					<article className={styles.card}>
						<div className={styles.cardHeader}>
							<CardTitle icon={ChartPie}>Bill status</CardTitle>
							<span className={styles.cardMeta}>{currentMonth}</span>
						</div>
						<div className={styles.statusFigures}>
							<div className={`${styles.statusFigure} ${styles.statusPaid}`}>
								<span>Paid</span>
								<strong>{billing.paidCount}</strong>
							</div>
							<div className={`${styles.statusFigure} ${styles.statusPartial}`}>
								<span>Partial</span>
								<strong>{billing.partialCount}</strong>
							</div>
							<div className={`${styles.statusFigure} ${styles.statusUnpaid}`}>
								<span>Unpaid</span>
								<strong>{billing.unpaidCount}</strong>
							</div>
						</div>
						<StatusGauge paid={billing.paidCount} partial={billing.partialCount} unpaid={billing.unpaidCount} />
						{overdue.count > 0 && (
							<p className={styles.overdue}>
								<CircleAlert size={15} aria-hidden="true" />
								{overdue.count} overdue {overdue.count === 1 ? "bill" : "bills"} with {peso(overdue.amount)} still unpaid
							</p>
						)}
					</article>

					<article className={`${styles.card} ${styles.tableCard}`} id="monthly-bills">
						<div className={styles.cardHeader}>
							<CardTitle icon={Receipt}>Balances</CardTitle>
							<div className={styles.cardHeaderEnd}>
								{ledger.length > 0 && (
									<span className={styles.cardMeta}>
										{ledger.length} {ledger.length === 1 ? "bill" : "bills"}
									</span>
								)}
								<Link className={styles.textLink} href="/monthly-bills">
									See all
								</Link>
							</div>
						</div>
						{ledger.length === 0 ? (
							<div className={styles.empty}>
								<strong>No bills for {currentMonth} yet</strong>
								<span>Create this month&apos;s bills to start tracking payments.</span>
								<Link className={styles.textLink} href="/monthly-bills/new">
									Create monthly bill
								</Link>
							</div>
						) : (
							<div className={styles.tableWrap}>
								<table className={styles.table} aria-label={`${currentMonth} bills`}>
									<thead>
										<tr>
											<th>Tenant</th>
											<th className={styles.colTotal}>Room</th>
											<th className={styles.colPaid}>Paid</th>
											<th className={styles.money}>Balance</th>
											<th>Status</th>
										</tr>
									</thead>
									<tbody>
										{byBalance.map((bill) => {
											const total = Number(bill.totalAmount) || 0;
											const outstanding = Number(bill.outstandingBalance) || 0;
											const paidRate = percent(total - outstanding, total);
											return (
												<tr key={bill.billId}>
													<td>
														<div className={styles.tenantCell}>
															<span className={styles.avatar}>{initials(bill.tenantName)}</span>
															<strong>{bill.tenantName}</strong>
														</div>
													</td>
													<td className={`${styles.colTotal} ${styles.moneyMuted}`}>{bill.roomNumber ?? "None"}</td>
													<td className={styles.colPaid}>
														<div className={styles.rate}>
															<div
																className={styles.rateTrack}
																role="progressbar"
																aria-label={`${bill.tenantName} paid`}
																aria-valuenow={Math.round(paidRate)}
																aria-valuemin={0}
																aria-valuemax={100}
															>
																<div className={styles.rateFill} style={{ width: `${paidRate}%` }} />
															</div>
															<span>{Math.round(paidRate)}%</span>
														</div>
													</td>
													<td className={`${styles.money} ${outstanding ? "" : styles.moneyMuted}`}>{peso(outstanding)}</td>
													<td>
														<span className={`be-badge is-${bill.status}`}>{STATUS_LABEL[bill.status]}</span>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</article>
				</section>
		</div>
	);
}
