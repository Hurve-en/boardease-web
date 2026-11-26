"use client";

import { archiveTenantAction, restoreTenantAction } from "@/app/tenants/actions";
import { Archive, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function TenantArchiveForm({
  tenantId,
  tenantName,
  archived,
}: {
  tenantId: string;
  tenantName: string;
  archived: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!armed) return;
    const timeout = window.setTimeout(() => setArmed(false), 3500);
    return () => window.clearTimeout(timeout);
  }, [armed]);

  if (archived) {
    return (
      <section aria-labelledby="restore-tenant-title">
        <h3 id="restore-tenant-title" className="text-sm font-semibold text-(--be-text-primary)">Archived tenant</h3>
        <p className="mt-1 text-xs leading-relaxed text-(--be-text-muted)">
          Restore {tenantName} to show them in active lists again.
        </p>
        <form action={restoreTenantAction.bind(null, tenantId)} className="mt-3">
          <button
            type="submit"
            aria-label={`Restore tenant ${tenantName}`}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-(--be-border-subtle) bg-(--be-surface) px-4 py-2 text-sm font-semibold text-(--be-success-text) transition hover:border-(--be-border-strong) hover:bg-(--be-success-surface)"
          >
            <RotateCcw size={16} /> Restore tenant
          </button>
        </form>
      </section>
    );
  }

  return (
    <section aria-labelledby="archive-tenant-title">
      <h3 id="archive-tenant-title" className="text-sm font-semibold text-(--be-text-primary)">Archive tenant</h3>
      <p className="mt-1 text-xs leading-relaxed text-(--be-text-muted)">
        Hides {tenantName} from active lists. Bills and receipt history are kept.
      </p>
      <form ref={formRef} action={archiveTenantAction.bind(null, tenantId)} className="mt-3">
        <button
          type="button"
          aria-label={armed ? `Confirm archiving tenant ${tenantName}` : `Archive tenant ${tenantName}`}
          aria-describedby={armed ? "archive-tenant-confirm-hint" : undefined}
          onClick={() => {
            if (armed) {
              setArmed(false);
              formRef.current?.requestSubmit();
            } else {
              setArmed(true);
            }
          }}
          className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${armed ? "border-(--be-action-primary) bg-(--be-action-primary) text-(--be-text-inverse) hover:bg-(--be-action-primary-hover)" : "border-(--be-border-subtle) bg-(--be-surface) text-(--be-text-secondary) hover:border-(--be-border-strong) hover:bg-(--be-surface-hover)"}`}
        >
          <Archive size={16} /> {armed ? "Click again to archive" : "Archive tenant"}
        </button>
        {armed ? (
          <p id="archive-tenant-confirm-hint" role="status" className="mt-2 text-xs leading-5 text-(--be-text-muted)">
            Click again within 3.5 seconds to archive.
          </p>
        ) : null}
      </form>
    </section>
  );
}
