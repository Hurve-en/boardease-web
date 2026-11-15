"use client";

import { useMemo, useState } from "react";
import { UserRound } from "lucide-react";
import { assignRoomAction } from "@/app/tenants/actions";

type Tenant = {
  id: string;
  name: string;
  contactNumber: string;
  roomNumber: string | null;
  status: "active" | "inactive";
  startDate: string;
};

type Room = {
  roomId: string;
  roomNumber: string;
  monthlyRent: number;
};

function todayInManila() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function displayDate(value: string) {
  if (!value) return "Not assigned";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(date);
}

function peso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

export function TenantTable({
  tenants,
  rooms,
}: {
  tenants: Tenant[];
  rooms: Room[];
}) {
  const firstTenant =
    tenants.find((tenant) => !tenant.roomNumber)?.id ?? tenants[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(firstTenant);
  const [roomId, setRoomId] = useState(rooms[0]?.roomId ?? "");
  const [startDate, setStartDate] = useState(todayInManila);
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTenant = tenants.find((tenant) => tenant.id === selectedId);
  const selectedRoom = rooms.find((room) => room.roomId === roomId);
  const activeAssignments = tenants.filter((tenant) => tenant.roomNumber).length;
  const readyTenants = tenants.length - activeAssignments;

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        ...room,
        label: `Room ${room.roomNumber}`,
      })),
    [rooms],
  );

  async function handleAssignRoom() {
    if (!selectedTenant) {
      setMessage("Select a tenant first.");
      return;
    }
    if (!roomId) {
      setMessage("Select an available room first.");
      return;
    }
    if (!startDate || !endDate) {
      setMessage("Choose a start date and an end date.");
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

  function resetAssignment() {
    setRoomId(rooms[0]?.roomId ?? "");
    setStartDate(todayInManila());
    setEndDate("");
    setMessage(null);
  }

  return (
    <div className="tenants-layout">
      <div className="tenants-directory-column">
        <section className="tenant-directory" aria-labelledby="tenant-list-title">
          <div className="tenant-list-heading">
            <h2 id="tenant-list-title">All tenants</h2>
            <span className="tenants-count">
              {tenants.length} {tenants.length === 1 ? "tenant" : "tenants"}
            </span>
          </div>

          <div className="tenants-table-wrap">
            <table className="tenants-table">
              <thead>
                <tr>
                  <th>Tenant / contact</th>
                  <th>Room</th>
                  <th>Since</th>
                  <th>Status</th>
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
                    className="tenant-row"
                  >
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedId(tenant.id)}
                        aria-pressed={selectedId === tenant.id}
                        className="tenant-select"
                      >
                        <strong>{tenant.name}</strong>
                        <span>{tenant.contactNumber || "Contact not provided"}</span>
                      </button>
                    </td>
                    <td>{tenant.roomNumber || "—"}</td>
                    <td>{tenant.roomNumber ? displayDate(tenant.startDate) : "Not assigned"}</td>
                    <td>
                      <span
                        className={`tenant-status ${tenant.roomNumber ? "is-active" : "is-unassigned"}`}
                      >
                        {tenant.roomNumber ? "Active" : "Unassigned"}
                      </span>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td className="tenant-empty" colSpan={4}>
                      No tenants to show yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="assignment-summary">
          {activeAssignments} active {activeAssignments === 1 ? "assignment" : "assignments"}
          {readyTenants > 0 && ` · ${readyTenants} ${readyTenants === 1 ? "tenant" : "tenants"} ready for a room`}
        </p>

        <section className="assignment-records">
          <h2>Assignment records</h2>
          <p className="assignment-records-subtitle">A dated history of each tenant’s stay</p>
          <p>
            When a tenant moves out, end their assignment to make the room available.
            Previous bills stay linked to that tenant.
          </p>
        </section>
      </div>

      <aside className="assignment-panel" aria-labelledby="assign-room-title">
        <header className="assignment-heading">
          <h2 id="assign-room-title">Assign a room</h2>
          <p>
            {selectedTenant
              ? `${selectedTenant.name} · ${selectedTenant.roomNumber ? `currently in Room ${selectedTenant.roomNumber}` : "no current assignment"}`
              : "Select a tenant to get started"}
          </p>
        </header>

        {selectedTenant && (
          <div className="assignment-tenant-card">
            <UserRound className="assignment-person-icon" aria-hidden="true" size={19} />
            <span>
              <strong>{selectedTenant.name}</strong>
              <small>{selectedTenant.contactNumber || "Contact not provided"}</small>
            </span>
          </div>
        )}

        <div className="assignment-form">
          <label className="assignment-field assignment-room">
            <span>Available room</span>
            <select value={roomId} onChange={(event) => setRoomId(event.target.value)}>
              <option value="">Select a room</option>
              {roomOptions.map((room) => (
                <option key={room.roomId} value={room.roomId}>
                  {room.label}
                </option>
              ))}
            </select>
          </label>

          {selectedRoom && (
            <div className="assignment-rent">
              <span>Monthly rent</span>
              <strong>{peso(selectedRoom.monthlyRent)}</strong>
            </div>
          )}

          <label className="assignment-field">
            <span>Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label className="assignment-field">
            <span>End date</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
            <small>Choose an end date for this stay.</small>
          </label>

          {selectedRoom && (
            <p className="assignment-notice">
              Room {selectedRoom.roomNumber} is available. Saving will mark it as occupied
              and begin {selectedTenant?.name ?? "the tenant"}’s assignment.
            </p>
          )}

          {message && (
            <p className="assignment-message" role="status">{message}</p>
          )}

          <button
            type="button"
            className="assignment-submit"
            disabled={isSubmitting || !selectedTenant || rooms.length === 0}
            onClick={() => void handleAssignRoom()}
          >
            {isSubmitting ? "Saving assignment…" : "Save room assignment"}
          </button>
          <button
            type="button"
            className="assignment-cancel"
            onClick={resetAssignment}
          >
            Cancel
          </button>
        </div>
      </aside>
    </div>
  );
}
