"use client";

import { deleteRoomAction } from "@/app/room_management/actions";
import { Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function DeleteRoomForm({ roomId, roomName }: { roomId: string; roomName: string }) {
  const [armed, setArmed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!armed) return;
    const timeout = window.setTimeout(() => setArmed(false), 3500);
    return () => window.clearTimeout(timeout);
  }, [armed]);

  return (
    <form ref={formRef} action={deleteRoomAction.bind(null, roomId)}>
      <button
        type="button"
        aria-label={armed ? `Confirm deletion of room ${roomName}` : `Delete room ${roomName}`}
        aria-describedby={armed ? "delete-room-confirm-hint" : undefined}
        onClick={() => {
          if (armed) {
            setArmed(false);
            formRef.current?.requestSubmit();
          } else {
            setArmed(true);
          }
        }}
        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${armed ? "border-(--be-danger-text) bg-(--be-danger-text) text-(--be-text-inverse) hover:brightness-90" : "border-(--be-border-subtle) bg-(--be-surface) text-(--be-danger-text) hover:border-(--be-border-strong) hover:bg-(--be-danger-surface)"}`}
      >
        <Trash2 size={16} /> {armed ? "Click again to delete" : "Delete room"}
      </button>
      {armed ? (
        <p id="delete-room-confirm-hint" role="status" className="mt-2 max-w-56 text-right text-xs leading-5 text-(--be-text-muted)">
          Click again within 3.5 seconds to permanently delete {roomName}.
        </p>
      ) : null}
    </form>
  );
}
