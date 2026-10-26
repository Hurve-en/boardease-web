import { verifyAdmin } from "@/lib/dal";
import { signOut } from "@/app/login/actions";
import { getDashboardData } from "@/lib/dashboard";
import {
	ArrowDownRight,
	ArrowRight,
	Bell,
	CalendarDays,
	Clock3,
	DoorOpen,
	FilePlus2,
	HandCoins,
	Receipt,
	Wallet,
} from "lucide-react";

const peso = (value: string | number) =>
	new Intl.NumberFormat("en-PH", {
		style: "currency",
		currency: "PHP",
		minimumFractionDigits: 2,
	}).format(Number(value) || 0);

const monthLabel = (value: string) =>
	new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "Asia/Manila" }).format(
		new Date(`${value}T00:00:00+08:00`),
	);

const todayLabel = new Intl.DateTimeFormat("en-GB", {
	day: "2-digit",
	month: "long",
	year: "numeric",
	timeZone: "Asia/Manila",
}).format(new Date());


export default async function DashboardPage() {
  const admin = await verifyAdmin();
  const dashboardData = await getDashboardData();
  const firstName = admin.email.split("@")[0].split(/[._-]/)[0];
	const collectionRate = Number(dashboardData.billing.totalBilled)
		? Math.min(100, (Number(dashboardData.billing.totalCollected) / Number(dashboardData.billing.totalBilled)) * 100)
		: 0;
	const currentMonth = monthLabel(dashboardData.billing.month);
	const latestPayment = dashboardData.recentPayments[0];

  return (
		<main className="dashboard-shell">
			<header className="topbar">
				<div className="breadcrumb"><span>OWNER / WEB</span><span className="crumb-divider">/</span><strong>DASHBOARD</strong></div>
				<div className="topbar-actions"><span>{todayLabel}</span><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><form action={signOut}><button className="signout-button" type="submit">Sign out</button></form></div>
			</header>

			<div className="dashboard-content">
				<section className="welcome-row">
					<div><p className="eyebrow">YOUR PROPERTY AT A GLANCE</p><h1>Good morning, {firstName}</h1><p className="welcome-copy">Here&apos;s where Maple House stands this month.</p></div>
					<div className="month-pill"><CalendarDays size={16} /><span>{currentMonth}</span></div>
				</section>

				<section className="stat-grid" aria-label="Monthly overview">
					<article className="stat-card"><div className="stat-heading"><span>Total billed</span><Receipt size={17} /></div><strong>{peso(dashboardData.billing.totalBilled)}</strong><p>{dashboardData.billing.paidCount + dashboardData.billing.partialCount + dashboardData.billing.unpaidCount} bills · {currentMonth}</p></article>
					<article className="stat-card"><div className="stat-heading"><span>Collected</span><Wallet size={17} /></div><strong>{peso(dashboardData.billing.totalCollected)}</strong><p>{collectionRate.toFixed(1)}% of this month&apos;s bills</p></article>
					<article className="stat-card"><div className="stat-heading"><span>Outstanding</span><Clock3 size={17} /></div><strong>{peso(dashboardData.billing.totalOutstanding)}</strong><p>{dashboardData.billing.partialCount + dashboardData.billing.unpaidCount} bills with a balance</p></article>
					<article className="stat-card"><div className="stat-heading"><span>Room occupancy</span><DoorOpen size={17} /></div><strong>{dashboardData.rooms.occupied} <span className="stat-total">/ {dashboardData.rooms.total}</span></strong><p>{dashboardData.rooms.total ? `${dashboardData.rooms.unoccupied} rooms available · ${Math.round((dashboardData.rooms.occupied / dashboardData.rooms.total) * 100)}% occupied` : "No room data yet"}</p></article>
				</section>

				<section className="insight-grid">
					<article className="panel collection-panel">
						<div className="panel-title"><div><h2>Monthly collection</h2><p>{currentMonth} · billing overview</p></div><span className="collection-icon"><HandCoins size={18} /></span></div>
						<div className="collection-amount-row"><strong>{peso(dashboardData.billing.totalCollected)}</strong><span>of {peso(dashboardData.billing.totalBilled)} billed</span></div>
						<div className="progress-track" role="progressbar" aria-label="Monthly collection progress" aria-valuenow={Math.round(collectionRate)} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${collectionRate}%` }} /></div>
						<div className="legend"><span><i className="legend-dot paid-dot" />{dashboardData.billing.paidCount} paid</span><span><i className="legend-dot partial-dot" />{dashboardData.billing.partialCount} partial</span><span><i className="legend-dot unpaid-dot" />{dashboardData.billing.unpaidCount} unpaid</span></div>
					</article>
					<aside className="panel next-steps"><div className="panel-title"><div><h2>Your next steps</h2><p>Keep your ledger up to date</p></div><span className="steps-icon"><ArrowDownRight size={18} /></span></div><p className="steps-copy">{dashboardData.overdue.count ? `${dashboardData.overdue.count} bills are overdue, with ${peso(dashboardData.overdue.amount)} outstanding.` : "Review outstanding balances and keep this month’s bills up to date."}</p><a className="primary-action" href="#monthly-bills"><ArrowRight size={16} /> View monthly bills</a><p className="helper-copy">Record each payment once it comes in.</p></aside>
				</section>

				<section className="bills-section" id="monthly-bills">
					<div className="section-heading"><div><p className="eyebrow">LEDGER</p><h2>{currentMonth} bills</h2></div><a className="create-action" href="#monthly-bills"><FilePlus2 size={16} /> Create monthly bill</a></div>
					<div className="bills-table-wrap"><table className="bills-table"><thead><tr><th>Tenant / bill</th><th>Room</th><th>Total bill</th><th>Outstanding</th><th>Status</th></tr></thead><tbody><tr><td colSpan={5}><div className="empty-state"><span className="empty-icon"><Receipt size={20} /></span><strong>Monthly bills will appear here</strong><span>Your bill records will show in this list once connected.</span></div></td></tr></tbody></table></div>
					<p className="ledger-note">{latestPayment ? `Latest payment: ${latestPayment.tenantName} · ${peso(latestPayment.amount)} · ${latestPayment.paymentDate}` : "No payments recorded this month yet."}</p>
				</section>
			</div>
			<footer className="dashboard-footer"><span>BoardEase · Maple House · All amounts in Philippine pesos (PHP)</span><span>Owner workspace</span></footer>
		</main>
  );
}
