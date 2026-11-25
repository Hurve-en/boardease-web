"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  DoorOpen,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Room = {
  roomId: string;
  roomNumber: string;
  boardingHouseName: string | null;
  monthlyRent: string;
  maxOccupancy: number;
  status: "occupied" | "unoccupied";
  currentTenant: string | null;
};
type Summary = { total: number; occupied: number; unoccupied: number };
const money = (value: string | number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(value) || 0,
  );

export default function RoomsClient() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    occupied: 0,
    unoccupied: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/rooms", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load rooms.");
      setRooms(data.rooms ?? []);
      setSummary(data.summary ?? { total: 0, occupied: 0, unoccupied: 0 });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load rooms.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRooms();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRooms]);

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) =>
        `${room.roomNumber} ${room.boardingHouseName ?? ""} ${room.currentTenant ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [rooms, query],
  );

  function openCreate() {
    router.push("/room_management/add");
  }

  return (
    <div className="dashboard-content rooms-content">
      <section className="rooms-heading">
        <div>
          <h1>Rooms</h1>
        </div>
        <button className="create-action" onClick={openCreate}>
          <Plus size={16} /> Add room
        </button>
      </section>
      <section className="room-stat-grid" aria-label="Room summary">
        <RoomStat label="Total rooms" value={summary.total} tone="brown" />
        <RoomStat label="Occupied" value={summary.occupied} tone="green" />
        <RoomStat label="Available" value={summary.unoccupied} tone="sand" />
      </section>
      <section className="room-list-panel panel">
        <div className="room-list-header">
          <div>
            <h2>Room list</h2>
          </div>
          <div className="room-tools">
            <label className="search-field">
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search rooms"
                aria-label="Search rooms"
              />
            </label>
            <button
              className="refresh-button"
              onClick={() => void loadRooms()}
              aria-label="Refresh rooms"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
        {loading ? (
          <div className="room-state">
            <LoaderCircle className="spin" size={22} />
            <span>Loading rooms…</span>
          </div>
        ) : error ? (
          <div className="room-state">
            <strong>Couldn’t load rooms</strong>
            <span>{error}</span>
            <button className="text-button" onClick={() => void loadRooms()}>
              Try again
            </button>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="room-state">
            <span className="empty-icon">
              <DoorOpen size={19} />
            </span>
            <strong>
              {query ? "No rooms match your search" : "No rooms added yet"}
            </strong>
            <span>
              {query
                ? "Try another room number or tenant name."
                : "Add your first room to start tracking occupancy."}
            </span>
            {!query && (
              <button
                className="primary-action room-empty-action"
                onClick={openCreate}
              >
                <Plus size={15} /> Add a room
              </button>
            )}
          </div>
        ) : (
          <div className="rooms-table-wrap">
            <table className="rooms-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Occupied tenants</th>
                  <th>Monthly rent</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => (
                  <tr key={room.roomId}>
                    <td>
                      <strong className="room-number">{room.roomNumber}</strong>
                    </td>
                    <td>
                      <span className="room-type">Standard</span>
                    </td>
                    <td>
                      {room.maxOccupancy}{" "}
                      {room.maxOccupancy === 1 ? "person" : "people"}
                    </td>
                    <td>
                      {room.currentTenant ? (
                        <span className="tenant-name">
                          {room.currentTenant}
                        </span>
                      ) : (
                        <span className="muted-cell">No tenant</span>
                      )}
                    </td>
                    <td className="room-money">{money(room.monthlyRent)}</td>
                    <td>
                      <span className={`room-status ${room.status}`}>
                        {room.status === "occupied" ? "Occupied" : "Available"}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="detail-button"
                        href={`/room_management/${encodeURIComponent(room.roomId)}`}
                      >
                        View <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function RoomStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: string;
}) {
  return (
    <article className="room-stat-card">
      <div className={`room-stat-icon ${tone}`}>
        <DoorOpen size={16} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
