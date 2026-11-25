"use client";

import { useMemo, useState } from "react";
import { UserRound } from "lucide-react";
import { assignRoomAction } from "@/app/tenants/actions";
import TenantArchiveForm from "@/app/tenants/TenantArchiveForm";

type Tenant = {
  id: string;
  name: string;
  contactNumber: string;
  roomNumber: string | null;
  status: "active" | "inactive" | "archived";
  startDate: string;
};

type Room = {
  boardingHouseName: string | null;
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
  // Parse and format in UTC so the calendar day never shifts with the viewer's timezone.
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
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
  const [selectedId, setSelectedId] = useState(
    () => tenants.find((tenant) => tenant.status !== "archived" && !tenant.roomNumber)?.id ?? tenants.find((tenant) => tenant.status !== "archived")?.id ?? tenants[0]?.id ?? "",
  );
  const [roomId, setRoomId] = useState(() => rooms[0]?.roomId ?? "");
  const [startDate, setStartDate] = useState(todayInManila);
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If the selected tenant was deleted (it no longer exists in props), fall back gracefully.
  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedId) ?? tenants[0],
    [tenants, selectedId],
  );
  const activeSelectedId = selectedTenant?.id ?? "";

  // If the chosen room is no longer available (e.g. just assigned), treat it as unselected.
  const selectedRoom = rooms.find((room) => room.roomId === roomId);
  const activeRoomId = selectedRoom?.roomId ?? "";

  const activeTenants = tenants.filter((tenant) => tenant.status !== "archived");
  const activeAssignments = activeTenants.filter((tenant) => tenant.roomNumber).length;
  const readyTenants = activeTenants.length - activeAssignments;

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        ...room,
        label: [room.boardingHouseName, `Room ${room.roomNumber}`]
          .filter(Boolean)
          .join(" · "),
      })),
    [rooms],
  );

  function selectTenant(id: string) {
    setSelectedId(id);
    setMessage(null);
  }

  async function handleAssignRoom() {
    if (!selectedTenant) {
      setMessage("Select a tenant first.");
      return;
    }
    if (!activeRoomId) {
      setMessage("Select an available room first.");
      return;
    }
    if (!startDate || !endDate) {
      setMessage("Choose a start date and an end date.");
      return;
    }
    if (endDate < startDate) {
      setMessage("The end date can't be before the start date.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await assignRoomAction({
        tenant_Id: activeSelectedId,
        roomId: activeRoomId,
        hasRecord: true,
        start_date: startDate,
        end_date: endDate,
        status: "active",
      });
      setMessage("Room assigned successfully.");
      setRoomId("");
      setEndDate("");
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
                {tenants.map((tenant) => {
                  const isSelected = activeSelectedId === tenant.id;
                  return (
                    <tr
                      key={tenant.id}
                      onClick={() => selectTenant(tenant.id)}
                      data-selected={isSelected}
                      className="tenant-row"
                    >
                      <td>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            selectTenant(tenant.id);
                          }}
                          aria-pressed={isSelected}
                          className="tenant-select"
                        >
                          <strong>{tenant.name}</strong>
                          <span>{tenant.contactNumber || "Contact not provided"}</span>
                        </button>
                      </td>
                      <td>{tenant.roomNumber || "—"}</td>
                      <td>
                        {tenant.roomNumber ? displayDate(tenant.startDate) : "Not assigned"}
                      </td>
                      <td>
                        <span
                          className={`tenant-status ${tenant.status === "archived" ? "is-archived" : tenant.roomNumber ? "is-active" : "is-unassigned"}`}
                        >
                          {tenant.status === "archived" ? "Archived" : tenant.roomNumber ? "Active" : "Unassigned"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
          {readyTenants > 0 &&
            ` · ${readyTenants} ${readyTenants === 1 ? "tenant" : "tenants"} ready for a room`}
        </p>

        <section className="assignment-records">
          <h2>Assignment records</h2>
          <p className="assignment-records-subtitle">
            A dated history of each tenant’s stay
          </p>
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
              ? `${selectedTenant.name} · ${
                  selectedTenant.roomNumber
                    ? `currently in Room ${selectedTenant.roomNumber}`
                    : "no current assignment"
                }`
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

        {selectedTenant?.status === "archived" ? (
          <div className="assignment-form">
            <p className="assignment-notice">This tenant is archived. Their bills, payment records, and receipts are preserved. Restore them to make the account active again.</p>
          </div>
        ) : <div className="assignment-form">
          <label className="assignment-field assignment-room">
            <span>Available room</span>
            <select
              value={activeRoomId}
              onChange={(event) => setRoomId(event.target.value)}
            >
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
              min={startDate || undefined}
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
            <p className="assignment-message" role="status">
              {message}
            </p>
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
        </div>}

        {selectedTenant && (
          <div className="assignment-danger-zone">
            <TenantArchiveForm
              tenantId={selectedTenant.id}
              tenantName={selectedTenant.name}
              archived={selectedTenant.status === "archived"}
            />
          </div>
        )}
      </aside>
    </div>
  );
}
