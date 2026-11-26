"use client";

import HouseField from "./HouseField";

import { editRoomDetails } from "./actions";
import DeleteRoomForm from "./DeleteRoomForm";
import type { UpdateActionState } from "@/lib/room_management";
import Link from "next/link";
import { useActionState, useState } from "react";

type FormValues = {
  roomName: string;
  monthlyRent: string;
  maxOccupancy: string;
};

const initialState: UpdateActionState = { success: false };

const labelClass = "block text-[13px] font-semibold text-(--be-text-primary)";
const inputClass =
  "mt-2 h-[42px] w-full rounded-lg border border-(--be-border-subtle) bg-white px-3.5 text-sm text-(--be-text-primary) outline-none transition focus:border-(--be-action-primary) focus:ring-2 focus:ring-(--be-action-primary)/20";

export default function EditRoomForm({
  room, houses,
}: {
  houses: {name: string}[];
  room: {
    boardingHouseName: string | null;
    id: string;
    identifier: string;
    monthly_rent: number;
    max_occupancy: number;
  };
}) {
  const [state, formAction, pending] = useActionState(
    editRoomDetails,
    initialState
  );

  const [form, setForm] = useState<FormValues>({
    roomName: room.identifier,
    monthlyRent: String(room.monthly_rent),
    maxOccupancy: String(room.max_occupancy),
  });

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-8 pb-12 pt-8">
      <h1 className="text-[32px] font-semibold tracking-tight text-(--be-text-primary)">
        Edit room
      </h1>
      <p className="mt-1 text-sm text-(--be-text-muted)">
        Update the details for {room.identifier}. Tenant assignment stays unchanged.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form
          action={formAction}
          className="overflow-hidden rounded-2xl border border-(--be-border-subtle) bg-white"
        >
          <input type="hidden" name="roomId" value={room.id} />

          <div className="px-6 pb-4 pt-5">
            <h2 className="text-base font-semibold text-(--be-text-primary)">Room details</h2>
            <p className="mt-1 text-[13px] text-(--be-text-muted)">
              All amounts are in Philippine pesos (PHP).
            </p>
          </div>

          <div className="space-y-5 border-t border-(--be-border-subtle) px-6 py-6">
            <HouseField houses={houses} value={room.boardingHouseName} className={inputClass} />
            <div>
              <label htmlFor="roomName" className={labelClass}>Room identifier</label>
              <input
                id="roomName"
                type="text"
                name="roomName"
                value={form.roomName}
                onChange={(e) => setForm({ ...form, roomName: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="monthlyRent" className={labelClass}>Monthly rent (PHP)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-(--be-text-muted)">₱</span>
                  <input
                    id="monthlyRent"
                    type="text"
                    inputMode="decimal"
                    name="monthlyRent"
                    value={form.monthlyRent}
                    onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
                    className={`${inputClass} pl-7`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="maxOccupancy" className={labelClass}>Max occupancy</label>
                <input
                  id="maxOccupancy"
                  type="text"
                  inputMode="numeric"
                  name="maxOccupancy"
                  value={form.maxOccupancy}
                  onChange={(e) => setForm({ ...form, maxOccupancy: e.target.value.replace(/\D/g, "") })}
                  className={inputClass}
                />
              </div>
            </div>

            {state.error && (
              <p role="alert" className="rounded-lg bg-(--be-danger-surface) px-3 py-2 text-sm text-(--be-danger-text)">
                {state.error}
              </p>
            )}
            {state.success && (
              <p className="rounded-lg bg-(--be-success-surface) px-3 py-2 text-sm text-(--be-success-text)">
                {state.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-(--be-border-subtle) bg-(--be-surface-subtle) px-6 py-4">
            <Link
              href={`/room_management/${room.id}`}
              className="inline-flex items-center rounded-lg border border-(--be-border-subtle) bg-white px-6 py-2.5 text-xs font-medium text-(--be-action-primary) transition hover:border-(--be-border-subtle) hover:bg-(--be-surface-subtle)"
            >
              Back to room details
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-(--be-action-primary) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--be-action-primary-hover) disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>

        <aside className="flex h-full flex-col">
          <div className="rounded-2xl border border-(--be-border-subtle) bg-(--be-surface-muted) p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-(--be-action-primary)">Room summary</h2>
            <span className="rounded-full bg-(--be-success-surface) px-2.5 py-1 text-[12px] font-semibold text-(--be-success-text)">
              Current
            </span>
            </div>
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-(--be-text-muted)">Room</dt>
                <dd className="font-semibold text-(--be-text-primary)">{room.identifier}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-(--be-text-muted)">Monthly rent</dt>
                <dd className="font-semibold text-(--be-text-primary)">₱{room.monthly_rent.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-(--be-text-muted)">Max occupancy</dt>
                <dd className="font-semibold text-(--be-text-primary)">{room.max_occupancy} people</dd>
              </div>
            </dl>
            <p className="mt-5 border-t border-(--be-brand-light) pt-4 text-xs leading-relaxed text-(--be-text-muted)">
              Editing room details does not change the current tenant assignment.
            </p>
          </div>
          <div className="mt-5">
            <DeleteRoomForm roomId={room.id} roomName={room.identifier} />
          </div>
        </aside>
      </div>
    </main>
  );
}
