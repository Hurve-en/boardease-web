"use client";

import {FormEvent, useMemo, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowLeft, Calculator, Check, Info} from "lucide-react";
import {calculateTotal} from "@/lib/bill-math";

export type BillableTenant = {
	tenantId: string;
	name: string;
	roomNumber: string;
	monthlyRent: string;
};

type Errors = {
	tenant?: string;
	month?: string;
	dueDate?: string;
	rent?: string;
	electric?: string;
	water?: string;
	form?: string;
};

const BILLS_PATH = "/monthly-bills";

const money = (value: string | number) =>
	new Intl.NumberFormat("en-PH", {style: "currency", currency: "PHP"}).format(
		Number(value) || 0,
	);
const longDate = (iso: string) =>
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

const isMonth = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const isDate = (value: string) =>
	/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

const toAmount = (value: string) =>
	value.trim() === "" ? Number.NaN : Number(value.replace(/,/g, ""));
const isMoney = (n: number) =>
	Number.isFinite(n) && n >= 0 && Math.round(n * 100) === n * 100;

const AMOUNT_PATTERN = /^\d{0,8}(\.\d{0,2})?$/;
const amountInput =
	(set: (value: string) => void) =>
	(e: React.ChangeEvent<HTMLInputElement>) => {
		if (AMOUNT_PATTERN.test(e.target.value)) set(e.target.value);
	};

const inputBase =
	"mt-2 h-[42px] w-full rounded-lg bg-white px-3.5 text-sm text-(--be-text-primary) outline-none transition";
const inputOk =
	"border border-(--be-border-strong) focus:border-(--be-action-primary) focus:ring-2 focus:ring-(--be-action-primary)/20";
const inputBad =
	"border border-(--be-danger-text) ring-1 ring-(--be-danger-text) focus:ring-2 focus:ring-(--be-danger-text)";

export default function CreateBillForm({tenants}: {tenants: BillableTenant[]}) {
	const router = useRouter();
	const [tenantId, setTenantId] = useState("");
	const [month, setMonth] = useState(currentMonth);
	const [dueDate, setDueDate] = useState(`${currentMonth()}-10`);
	const [rent, setRent] = useState("");
	const [electric, setElectric] = useState("");
	const [water, setWater] = useState("");
	const [errors, setErrors] = useState<Errors>({});
	const [saving, setSaving] = useState(false);

	const tenant = tenants.find((t) => t.tenantId === tenantId);

	const preview = useMemo(() => {
		const n = (v: string) => (isMoney(toAmount(v)) ? toAmount(v) : 0);
		return calculateTotal(n(rent), n(electric), n(water));
	}, [rent, electric, water]);

	function chooseTenant(id: string) {
		setTenantId(id);
		const picked = tenants.find((t) => t.tenantId === id);
		if (picked) setRent(picked.monthlyRent);
	}

	function chooseMonth(value: string) {
		if (!isMonth(value)) return;
		setMonth(value);
		setDueDate(`${value}-10`);
	}

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (saving) return;

		const next: Errors = {};
		const rentN = toAmount(rent);
		const electricN = toAmount(electric);
		const waterN = toAmount(water);

		if (!tenant) next.tenant = "Choose a tenant.";
		if (!month) next.month = "Choose a billing month.";
		if (!isDate(dueDate)) next.dueDate = "Choose a due date.";
		else if (dueDate < `${month}-01`)
			next.dueDate = "The due date can’t be before the billing month.";
		if (!isMoney(rentN))
			next.rent = "Enter a valid amount (₱0.00 or more, up to 2 decimals).";
		if (!isMoney(electricN))
			next.electric = "Enter a valid amount (₱0.00 or more, up to 2 decimals).";
		if (!isMoney(waterN))
			next.water = "Enter a valid amount (₱0.00 or more, up to 2 decimals).";

		setErrors(next);
		if (Object.keys(next).length > 0) return;

		setSaving(true);
		try {
			const response = await fetch("/api/bills", {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					tenantId,
					billingMonth: month,
					dueDate,
					rentAmount: rentN,
					electricCharge: electricN,
					waterCharge: waterN,
				}),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				setErrors(
					response.status === 409
						? {
								month: `${tenant?.name} already has a bill for ${monthLabel(month)}.`,
							}
						: {form: data.error || "Unable to save the bill."},
				);
				return;
			}
			router.push(BILLS_PATH);
			router.refresh();
		} catch {
			setErrors({
				form: "Unable to save the bill. Check your connection and try again.",
			});
		} finally {
			setSaving(false);
		}
	}

	const errorCount = [
		errors.tenant,
		errors.month,
		errors.dueDate,
		errors.rent,
		errors.electric,
		errors.water,
	].filter(Boolean).length;

	return (
		<main className="mx-auto w-full max-w-[1200px] flex-1 px-8 pb-12 pt-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-[32px] font-semibold tracking-tight text-(--be-text-primary)">
						Create monthly bill
					</h1>
					<p className="mt-1 text-sm text-(--be-text-muted)">
						Choose a tenant, add monthly charges and review before saving.
					</p>
				</div>
				<Link
					href={BILLS_PATH}
					className="inline-flex h-[42px] items-center gap-2 rounded-lg border border-(--be-border-strong) bg-white px-4 text-[13px] font-semibold text-(--be-action-primary) hover:bg-(--be-surface-subtle)">
					<ArrowLeft size={15} /> Back to bills
				</Link>
			</div>

			<form
				onSubmit={submit}
				noValidate
				className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
				<div className="space-y-5">
					{(errorCount > 0 || errors.form) && (
						<div
							role="alert"
							className="rounded-lg bg-(--be-danger-surface) px-4 py-3.5 text-(--be-danger-text)">
							<p className="text-[13px] font-semibold">Bill not saved</p>
							<p className="mt-0.5 text-xs">
								{errorCount > 0
									? `Fix the ${errorCount} field${errorCount > 1 ? "s" : ""} below, then save again.`
									: errors.form}
							</p>
						</div>
					)}

					<section className="rounded-2xl border border-(--be-border-subtle) bg-white p-5">
						<h2 className="text-base font-semibold text-(--be-text-primary)">
							Bill details
						</h2>
						<p className="mt-1 text-[13px] text-(--be-text-muted)">
							A separate bill for each tenant and month
						</p>

						<Field id="tenant" label="Tenant" error={errors.tenant}>
							<select
								id="tenant"
								value={tenantId}
								onChange={(e) => chooseTenant(e.target.value)}
								aria-invalid={Boolean(errors.tenant)}
								className={`${inputBase} ${errors.tenant ? inputBad : inputOk}`}>
								<option value="">Select a tenant</option>
								{tenants.map((t) => (
									<option key={t.tenantId} value={t.tenantId}>
										{t.name}, Room {t.roomNumber}
									</option>
								))}
							</select>
						</Field>
						{tenants.length === 0 && (
							<p className="mt-2 text-xs text-(--be-text-muted)">
								No tenants with a room assignment yet. Assign a room on the
								Tenants page first.
							</p>
						)}

						<div className="grid gap-4 sm:grid-cols-2">
							<Field id="month" label="Billing month" error={errors.month}>
								<input
									id="month"
									type="month"
									value={month}
									max="9999-12"
									onChange={(e) => chooseMonth(e.target.value)}
									aria-invalid={Boolean(errors.month)}
									className={`${inputBase} ${errors.month ? inputBad : inputOk}`}
								/>
							</Field>
							<Field id="due" label="Due date" error={errors.dueDate}>
								<input
									id="due"
									type="date"
									value={dueDate}
									min={`${month}-01`}
									max="9999-12-31"
									onChange={(e) => setDueDate(e.target.value)}
									aria-invalid={Boolean(errors.dueDate)}
									className={`${inputBase} ${errors.dueDate ? inputBad : inputOk}`}
								/>
							</Field>
						</div>
					</section>

					<section className="rounded-2xl border border-(--be-border-subtle) bg-white p-5">
						<h2 className="text-base font-semibold text-(--be-text-primary)">
							Monthly charges
						</h2>
						<p className="mt-1 text-[13px] text-(--be-text-muted)">
							Enter the amounts in Philippine pesos (PHP).
						</p>

						<Field id="rent" label="Rent amount" error={errors.rent}>
							<input
								id="rent"
								type="text"
								inputMode="decimal"
								placeholder="0.00"
								maxLength={11}
								value={rent}
								onChange={amountInput(setRent)}
								aria-invalid={Boolean(errors.rent)}
								className={`${inputBase} ${errors.rent ? inputBad : inputOk}`}
							/>
						</Field>
						{tenant && !errors.rent && (
							<p className="mt-2 text-xs text-(--be-text-muted)">
								From Room {tenant.roomNumber}’s monthly rent.
							</p>
						)}

						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								id="electric"
								label="Electricity charge"
								error={errors.electric}>
								<input
									id="electric"
									type="text"
									inputMode="decimal"
									placeholder="0.00"
									maxLength={11}
									value={electric}
									onChange={amountInput(setElectric)}
									aria-invalid={Boolean(errors.electric)}
									className={`${inputBase} ${errors.electric ? inputBad : inputOk}`}
								/>
							</Field>
							<Field id="water" label="Water charge" error={errors.water}>
								<input
									id="water"
									type="text"
									inputMode="decimal"
									placeholder="0.00"
									maxLength={11}
									value={water}
									onChange={amountInput(setWater)}
									aria-invalid={Boolean(errors.water)}
									className={`${inputBase} ${errors.water ? inputBad : inputOk}`}
								/>
							</Field>
						</div>

						<p className="mt-5 flex items-center gap-2 rounded-lg bg-(--be-surface-subtle) px-4 py-3 text-xs text-(--be-text-secondary)">
							<Calculator size={15} /> Total is calculated automatically: rent +
							electricity + water.
						</p>
					</section>
				</div>

				<aside className="space-y-4">
					<section className="rounded-2xl border border-(--be-border-subtle) bg-white p-5">
						<h2 className="text-base font-semibold text-(--be-text-primary)">
							Bill preview
						</h2>
						<p className="mt-1 text-xs text-(--be-text-muted)">
							{monthLabel(month)}, not yet saved
						</p>

						<p className="mt-5 text-xl font-semibold text-(--be-text-primary)">
							{tenant?.name ?? "No tenant selected"}
						</p>
						<p className="mt-1 text-xs text-(--be-text-muted)">
							{tenant
								? `Room ${tenant.roomNumber}, Maple House`
								: "Choose a tenant to see their room"}
						</p>

						<dl className="mt-5 space-y-3 border-t border-(--be-border-subtle) pt-4 text-[13px]">
							<PreviewLine label="Rent" value={money(toAmount(rent) || 0)} />
							<PreviewLine
								label="Electricity"
								value={money(toAmount(electric) || 0)}
							/>
							<PreviewLine label="Water" value={money(toAmount(water) || 0)} />
						</dl>

						<div className="mt-4 space-y-3 border-t border-(--be-border-subtle) pt-4">
							<div className="flex items-baseline justify-between">
								<span className="text-sm text-(--be-text-secondary)">Total amount</span>
								<strong className="min-w-0 break-all text-right text-2xl font-semibold text-(--be-text-primary)">
									{money(preview)}
								</strong>
							</div>
							<PreviewLine
								label="Due date"
								value={isDate(dueDate) ? longDate(dueDate) : "—"}
							/>
							<div className="flex items-center justify-between text-[13px]">
								<span className="text-(--be-text-muted)">Status after saving</span>
								<span className="rounded-full bg-(--be-danger-surface) px-3 py-1 text-[12.5px] font-semibold text-(--be-danger-text)">
									UNPAID
								</span>
							</div>
						</div>

						<button
							type="submit"
							disabled={saving}
							className="mt-5 inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-(--be-action-primary) text-[13px] font-semibold text-white transition hover:bg-(--be-action-primary-hover) disabled:opacity-70">
							<Check size={15} /> {saving ? "Saving…" : "Save monthly bill"}
						</button>
						<button
							type="button"
							onClick={() => router.push(BILLS_PATH)}
							className="mt-3 h-[42px] w-full rounded-lg border border-(--be-border-strong) text-[13px] font-semibold text-(--be-text-secondary) hover:bg-(--be-surface-subtle)">
							Cancel
						</button>
					</section>

					<p className="flex gap-3 rounded-2xl bg-(--be-surface-muted) p-4 text-xs leading-relaxed text-(--be-text-secondary)">
						<Info size={15} className="mt-0.5 shrink-0" />
						Saving makes this bill visible in{" "}
						{tenant ? `${tenant.name}’s` : "the tenant’s"} mobile app. Payments
						are recorded separately.
					</p>
				</aside>
			</form>
		</main>
	);
}

function Field({
	id,
	label,
	error,
	children,
}: {
	id: string;
	label: string;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="mt-5">
			<label
				htmlFor={id}
				className="block text-[13px] font-semibold text-(--be-text-primary)">
				{label}
			</label>
			{children}
			{error && <p className="mt-2 text-xs text-(--be-danger-text)">{error}</p>}
		</div>
	);
}

function PreviewLine({label, value}: {label: string; value: string}) {
	return (
		<div className="flex items-center justify-between text-[13px]">
			<dt className="text-(--be-text-muted)">{label}</dt>
			<dd className="text-(--be-text-primary)">{value}</dd>
		</div>
	);
}
