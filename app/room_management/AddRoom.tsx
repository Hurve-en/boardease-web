"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const ROOMS_PATH = "/rooms";

type Errors = {
  identifier?: string;
  rent?: string;
  capacity?: string;
  form?: string; // general error from the server
};

type FormValues = {
  roomNumber: string;
  monthlyRent: string;
  maxOccupancy: string;
};

const inputBase =
  "mt-2 h-[42px] w-full rounded-lg bg-white px-3.5 text-sm text-[#2f2520] outline-none transition";
const inputOk =
  "border border-[#e0d8cb] focus:border-[#5e3d2b] focus:ring-2 focus:ring-[#5e3d2b]/20";
const inputBad =
  "border border-[#9b3a2e] ring-1 ring-[#9b3a2e] focus:ring-2 focus:ring-[#9b3a2e]";

export default function RoomsClient() {
  const router = useRouter();
  const [form, setForm] = useState<FormValues>({
    roomNumber: "",
    monthlyRent: "",
    maxOccupancy: "1",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  // Number of invalid fields (the server-wide message is counted separately)
  const errorCount = [errors.identifier, errors.rent, errors.capacity].filter(
    Boolean
  ).length;
  const showBanner = errorCount > 0 || Boolean(errors.form);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const next: Errors = {};
    const rent = Number(form.monthlyRent.replace(/,/g, ""));
    const capacity = Number(form.maxOccupancy);

    if (!form.roomNumber.trim()) {
      next.identifier = "Enter a room identifier.";
    }
    if (!form.monthlyRent.trim() || !Number.isFinite(rent) || rent <= 0) {
      next.rent = "Enter a valid amount greater than ₱0.00.";
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      next.capacity = "Enter a whole number of at least 1.";
    }

    setErrors(next); // entries stay in the inputs
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomNumber: form.roomNumber.trim(),
          monthlyRent: rent,
          maxOccupancy: capacity,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.error || "Unable to create room.";
        // Assumes your API answers 409 when the room already exists.
        // If it uses another status, change the number here.
        if (response.status === 409) {
          setErrors({ identifier: message });
        } else {
          setErrors({ form: message });
        }
        return;
      }

      router.push(ROOMS_PATH);
      router.refresh();
    } catch {
      setErrors({
        form: "Unable to create room. Check your connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-8 pb-12 pt-8">
        <h1 className="text-[32px] font-semibold tracking-tight text-[#2f2520]">
          Add room
        </h1>
        <p className="mt-1 text-sm text-[#7d7269]">
          Create a room for Maple House. Assign a tenant after saving.
        </p>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Form card */}
          <form
            onSubmit={submit}
            noValidate
            className="rounded-2xl border border-[#e8e1d6] bg-white p-5"
          >
            <h2 className="text-base font-semibold text-[#2f2520]">
              Room details
            </h2>
            <p className="mt-1 text-[13px] text-[#8a7f76]">
              All fields are required. All amounts are in Philippine pesos
              (PHP).
            </p>

            {showBanner && (
              <div
                role="alert"
                className="mt-5 flex gap-3 rounded-lg bg-[#f7e4dd] px-4 py-3.5 text-[#9b3a2e]"
              >
                <svg
                  className="mt-0.5 shrink-0"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
                <div>
                  <p className="text-[13px] font-semibold">Room not saved</p>
                  <p className="mt-0.5 text-xs">
                    {errorCount > 0
                      ? `Fix the ${errorCount} field${
                          errorCount > 1 ? "s" : ""
                        } below, then save again. Your entries have been kept.`
                      : errors.form}
                  </p>
                </div>
              </div>
            )}

            {/* Room identifier */}
            <label
              htmlFor="identifier"
              className="mt-6 block text-[13px] font-semibold text-[#2f2520]"
            >
              Room identifier *
            </label>
            <input
              id="identifier"
              type="text"
              value={form.roomNumber}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
              aria-invalid={Boolean(errors.identifier)}
              aria-describedby={errors.identifier ? "identifier-error" : undefined}
              className={`${inputBase} ${errors.identifier ? inputBad : inputOk}`}
            />
            {errors.identifier && (
              <p id="identifier-error" className="mt-2 text-xs text-[#9b3a2e]">
                {errors.identifier}
              </p>
            )}

            {/* Monthly rent */}
            <label
              htmlFor="rent"
              className="mt-5 block text-[13px] font-semibold text-[#2f2520]"
            >
              Monthly rent (PHP) *
            </label>
            <input
              id="rent"
              type="text"
              inputMode="decimal"
              value={form.monthlyRent}
              onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
              onBlur={() => {
                const n = Number(form.monthlyRent.replace(/,/g, ""));
                if (form.monthlyRent.trim() && Number.isFinite(n) && n >= 0) {
                  setForm((f) => ({ ...f, monthlyRent: n.toFixed(2) }));
                }
              }}
              aria-invalid={Boolean(errors.rent)}
              aria-describedby={errors.rent ? "rent-error" : undefined}
              className={`${inputBase} ${errors.rent ? inputBad : inputOk}`}
            />
            {errors.rent && (
              <p id="rent-error" className="mt-2 text-xs text-[#9b3a2e]">
                {errors.rent}
              </p>
            )}

            {/* Max occupancy */}
            <label
              htmlFor="capacity"
              className="mt-5 block text-[13px] font-semibold text-[#2f2520]"
            >
              Max occupancy *
            </label>
            <input
              id="capacity"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={form.maxOccupancy}
              onChange={(e) => setForm({ ...form, maxOccupancy: e.target.value })}
              aria-invalid={Boolean(errors.capacity)}
              aria-describedby={errors.capacity ? "capacity-error" : undefined}
              className={`${inputBase} ${errors.capacity ? inputBad : inputOk}`}
            />
            {errors.capacity && (
              <p id="capacity-error" className="mt-2 text-xs text-[#9b3a2e]">
                {errors.capacity}
              </p>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#ebe4d8] pt-5">
              <button
                type="button"
                onClick={() => router.push(ROOMS_PATH)}
                className="h-[38px] rounded-lg px-5 text-[13px] font-semibold text-[#4a3f38] transition hover:bg-[#f7f3ec]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-[38px] rounded-lg bg-[#5e3d2b] px-6 text-[13px] font-semibold text-white transition hover:bg-[#4d3123] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5e3d2b] focus-visible:ring-offset-2 disabled:opacity-70"
              >
                {saving ? "Saving…" : "Save room"}
              </button>
            </div>
          </form>

          {/* Side cards */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-[#e8e1d6] bg-white p-5">
              <h2 className="text-base font-semibold text-[#2f2520]">
                Occupancy after saving
              </h2>
              <span className="mt-4 inline-block rounded-full bg-[#e4eedf] px-3 py-1 text-[11px] font-semibold text-[#3d6b3a]">
                Available
              </span>
              <p className="mt-5 text-[13px] leading-relaxed text-[#7d7269]">
                New rooms have no tenant assignment and start as Available.
                Occupancy updates from tenant assignments, not a room setting.
              </p>
              <p className="mt-5 text-[13px] font-semibold text-[#5e3d2b]">
                Save first, then Assign tenant →
              </p>
            </div>

            <div className="flex gap-3 rounded-2xl bg-[#efe6dc] p-4 text-[#5a4a3f]">
              <svg
                className="mt-0.5 shrink-0"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <div>
                <p className="text-[13px] font-semibold text-[#3a2a21]">
                  Monthly rent
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  The monthly rent entered here is used when creating a bill.
                  Keep room rent up to date before billing.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <p className="mt-5 text-xs text-[#7d7269]">
          A room is added only after a successful save. Cancel returns to Rooms
          without creating a room.
        </p>
    </main>
  );
}