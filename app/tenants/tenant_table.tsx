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
      if (!selectedId || !roomId || !startDate || !endDate) return;

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
          <tr key={tenant.id} onClick={() => setSelectedId(tenant.id)} 
          className={selectedId === tenant.id ? 'bg-blue-100' : 'hover:bg-gray-100'} >
            <td className="px-6 py-4 whitespace-nowrap font-bold">
              {tenant.name}
            </td>
            <td>{tenant.roomNumber || "Unassigned"}</td>
            <td>{tenant.status}</td>
          </tr>
        ))}
      </tbody>
      <tfoot></tfoot>


      <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
        <option value="">Select Room</option>
        {rooms.map((r) => (
          <option key={r.roomId} value={r.roomId}>
            {r.roomNumber}
          </option>
        ))}
      </select>


        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

      {/* only enabled once everything is filled in */}
      <button
        disabled={isSubmitting || !selectedId || !roomId || !startDate || !endDate}
        onClick={() => void handleAssignRoom()}
      >
        {isSubmitting ? "Assigning..." : "Assign"}
      </button>
      </table>
      {message && <p role="status">{message}</p>}
    </>
  );
}