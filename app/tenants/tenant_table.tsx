"use client";

import { useState } from "react";
import { assignRoomAction } from "@/app/tenants/actions";


type Tenant = {
    id: string;
    name: string;
    roomNumber: string | null;
    status: "active" | "inactive";
}


type Room = {
    roomId: string;
    roomNumber: string;
    monthlyRent: number;
}

export function TenantTable({tenants, rooms}: {tenants: Tenant[], rooms: Room[]}) { 

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [roomId, setRoomId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleAssignRoom() {
      if (!selectedId) {
        setMessage("Select a tenant first.");
        return;
      }
      if (!roomId) {
        setMessage("Select a room first.");
        return;
      }
      if (!startDate || !endDate) {
        setMessage("Select both a start date and an end date.");
        return;
      }

      setIsSubmitting(true);
      setMessage(null);

      try {
        await assignRoomAction({
          tenant_Id: selectedId,
          roomId,
          hasRecord: true,
          start_date: startDate,
          end_date: endDate,
          status: "active",
        });
        setMessage("Room assigned successfully.");
      } catch {
        setMessage("The room could not be assigned. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }

  return (
    <>
      <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Room</th>
          <th>Status</th>
          <th>Assignment</th>
        </tr>
      </thead>
      <tbody>
        {tenants.map((tenant) => (
          <tr
            key={tenant.id}
            onClick={() => setSelectedId(tenant.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedId(tenant.id);
              }
            }}
            tabIndex={0}
            aria-selected={selectedId === tenant.id}
            className="cursor-pointer hover:bg-gray-100"
            style={{
              backgroundColor:
                selectedId === tenant.id
                  ? "var(--be-surface-selected)"
                  : undefined,
            }}
          >
            <td className="px-6 py-4 whitespace-nowrap font-bold">
              <button
                type="button"
                onClick={() => setSelectedId(tenant.id)}
                aria-pressed={selectedId === tenant.id}
                className="cursor-pointer border-0 bg-transparent p-0 text-left font-bold"
              >
                {tenant.name}
              </button>
            </td>
            <td>{tenant.roomNumber || "Unassigned"}</td>
            <td>{tenant.status}</td>
            <td>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="selected-tenant"
                  value={tenant.id}
                  checked={selectedId === tenant.id}
                  onChange={() => setSelectedId(tenant.id)}
                  aria-label={`Select ${tenant.name}`}
                />
                <span>{selectedId === tenant.id ? "Selected" : "Select"}</span>
              </label>
            </td>
          </tr>
        ))}
      </tbody>
      </table>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span>Room</span>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="">Select Room</option>
            {rooms.map((r) => (
              <option key={r.roomId} value={r.roomId}>
                {r.roomNumber}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span>Start date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>End date</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleAssignRoom()}
        >
          {isSubmitting ? "Assigning..." : "Assign"}
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </>
  );
}