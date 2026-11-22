"use client";

import {FormEvent, useMemo, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowLeft, Check} from "lucide-react";
import {calculateTotal} from "@/lib/bill-math";

export type EditableBill = {
	billId: string;
	tenantName: string;
	roomNumber: string | null;
	billingMonth: string;
	dueDate: string;
	rentAmount: string;
	electricCharge: string;
	waterCharge: string;
};

type Errors = {
	dueDate?: string;
	rent?: string;
	electric?: string;
	water?: string;
	form?: string;
};

const AMOUNT_PATTERN = /^\d{0,8}(\.\d{0,2})?$/;
const amountInput =
	(set: (value: string) => void) =>
	(e: React.ChangeEvent<HTMLInputElement>) => {
		if (AMOUNT_PATTERN.test(e.target.value)) set(e.target.value);
	};
const toAmount = (value: string) =>
	value.trim() === "" ? Number.NaN : Number(value);
const isMoney = (n: number) =>
	Number.isFinite(n) && n >= 0 && Math.round(n * 100) === n * 100;
const isDate = (value: string) =>
	/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
const money = (value: string | number) =>
	new Intl.NumberFormat("en-PH", {style: "currency", currency: "PHP"}).format(
		Number(value) || 0,
	);
const monthLabel = (iso: string) =>
	new Intl.DateTimeFormat("en-GB", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${iso}T00:00:00Z`));

const inputBase =
	"mt-2 h-[42px] w-full rounded-lg bg-white px-3.5 text-sm text-[#2f2520] outline-none transition";
const inputOk =
	"border border-[#e0d8cb] focus:border-[#5e3d2b] focus:ring-2 focus:ring-[#5e3d2b]/20";
const inputBad =
	"border border-[#9b3a2e] ring-1 ring-[#9b3a2e] focus:ring-2 focus:ring-[#9b3a2e]";
const INVALID = "Enter a valid amount (₱0.00 or more, up to 2 decimals).";

export default function EditBillForm({
	bill,
	paid,
}: {
	bill: EditableBill;
	paid: string;
}) {
	const router = useRouter();
	const detailPath = `/monthly-bills/${bill.billId}`;
	const [dueDate, setDueDate] = useState(bill.dueDate);
	const [rent, setRent] = useState(bill.rentAmount);
	const [electric, setElectric] = useState(bill.electricCharge);
	const [water, setWater] = useState(bill.waterCharge);
	const [errors, setErrors] = useState<Errors>({});
	const [saving, setSaving] = useState(false);

	const total = useMemo(() => {
		const n = (v: string) => (isMoney(toAmount(v)) ? toAmount(v) : 0);
		return calculateTotal(n(rent), n(electric), n(water));
	}, [rent, electric, water]);
	const balance = Math.max(0, Number(total) - Number(paid));

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (saving) return;

		const next: Errors = {};
		if (!isDate(dueDate)) next.dueDate = "Choose a due date.";
		else if (dueDate < bill.billingMonth)
			next.dueDate = "The due date can’t be before the billing month.";
		if (!isMoney(toAmount(rent))) next.rent = INVALID;
		if (!isMoney(toAmount(electric))) next.electric = INVALID;
		if (!isMoney(toAmount(water))) next.water = INVALID;
		setErrors(next);
		if (Object.keys(next).length > 0) return;

		setSaving(true);
		try {
			const response = await fetch(`/api/bills/${bill.billId}`, {
				method: "PATCH",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					dueDate,
					rentAmount: toAmount(rent),
					electricCharge: toAmount(electric),
					waterCharge: toAmount(water),
				}),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				setErrors({form: data.error || "Unable to save the changes."});
				return;
			}
			router.push(detailPath);
			router.refresh();
		} catch {
			setErrors({
				form: "Unable to save the changes. Check your connection and try again.",
			});
		} finally {
			setSaving(false);
		}
	}

	return (
		<main className="mx-auto w-full max-w-[1200px] flex-1 px-8 pb-12 pt-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-[32px] font-semibold tracking-tight text-[#2f2520]">
						Edit bill
					</h1>
					<p className="mt-1 text-sm text-[#7d7269]">
						{bill.tenantName} ·{" "}
						{bill.roomNumber ? `Room ${bill.roomNumber}` : "No room"} ·{" "}
						{monthLabel(bill.billingMonth)}
					</p>
				</div>
				<Link
					href={detailPath}
					className="inline-flex h-[42px] items-center gap-2 rounded-lg border border-[#e0d8cb] bg-white px-4 text-[13px] font-semibold text-[#5e3d2b] hover:bg-[#f7f3ec]">
					<ArrowLeft size={15} /> Back to bill
				</Link>
			</div>

			<form
				onSubmit={submit}
				noValidate
				className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
				<section className="space-y-5 rounded-2xl border border-[#e8e1d6] bg-white p-5">
					{errors.form && (
						<p
							role="alert"
							className="rounded-lg bg-[#f7e4dd] px-4 py-3 text-xs text-[#9b3a2e]">
							{errors.form}
						</p>
					)}
					<p className="text-[13px] text-[#8a7f76]">
						Tenant and billing month can’t be changed. To change them, delete
						this bill and create a new one.
					</p>

					<Field id="due" label="Due date" error={errors.dueDate}>
						<input
							id="due"
							type="date"
							value={dueDate}
							min={bill.billingMonth}
							max="9999-12-31"
							onChange={(e) => setDueDate(e.target.value)}
							aria-invalid={Boolean(errors.dueDate)}
							className={`${inputBase} ${errors.dueDate ? inputBad : inputOk}`}
						/>
					</Field>
					<Field id="rent" label="Rent amount" error={errors.rent}>
						<input
							id="rent"
							type="text"
							inputMode="decimal"
							maxLength={11}
							value={rent}
							onChange={amountInput(setRent)}
							aria-invalid={Boolean(errors.rent)}
							className={`${inputBase} ${errors.rent ? inputBad : inputOk}`}
						/>
					</Field>
					<div className="grid gap-4 sm:grid-cols-2">
						<Field
							id="electric"
							label="Electricity charge"
							error={errors.electric}>
							<input
								id="electric"
								type="text"
								inputMode="decimal"
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
								maxLength={11}
								value={water}
								onChange={amountInput(setWater)}
								aria-invalid={Boolean(errors.water)}
								className={`${inputBase} ${errors.water ? inputBad : inputOk}`}
							/>
						</Field>
					</div>
				</section>

				<aside className="rounded-2xl border border-[#e8e1d6] bg-white p-5">
					<h2 className="text-base font-semibold text-[#2f2520]">
						After saving
					</h2>
					<dl className="mt-4 space-y-3 text-[13px]">
						<Line label="New total" value={money(total)} />
						<Line label="Already paid" value={money(paid)} />
						<Line label="New balance" value={money(balance)} />
					</dl>
					{Number(total) < Number(paid) && (
						<p className="mt-3 text-xs text-[#9b3a2e]">
							The total can’t be less than what’s already been paid.
						</p>
					)}
					<button
						type="submit"
						disabled={saving}
						className="mt-5 inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-[#5e3d2b] text-[13px] font-semibold text-white hover:bg-[#4d3123] disabled:opacity-70">
						<Check size={15} /> {saving ? "Saving…" : "Save changes"}
					</button>
					<button
						type="button"
						onClick={() => router.push(detailPath)}
						className="mt-3 h-[42px] w-full rounded-lg border border-[#e0d8cb] text-[13px] font-semibold text-[#4a3f38] hover:bg-[#f7f3ec]">
						Cancel
					</button>
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
		<div>
			<label
				htmlFor={id}
				className="block text-[13px] font-semibold text-[#2f2520]">
				{label}
			</label>
			{children}
			{error && <p className="mt-2 text-xs text-[#9b3a2e]">{error}</p>}
		</div>
	);
}

function Line({label, value}: {label: string; value: string}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<dt className="text-[#7d7269]">{label}</dt>
			<dd className="break-all text-right text-[#2f2520]">{value}</dd>
		</div>
	);
}
