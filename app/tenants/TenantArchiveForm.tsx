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
      <form action={restoreTenantAction.bind(null, tenantId)}>
        <button
          type="submit"
          aria-label={`Restore tenant ${tenantName}`}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#e8dfd5] bg-white px-4 py-2 text-sm font-semibold text-[#38674b] transition hover:border-[#b9d2bf] hover:bg-[#f1f7f1]"
        >
          <RotateCcw size={16} /> Restore tenant
        </button>
      </form>
    );
  }

  return (
    <form ref={formRef} action={archiveTenantAction.bind(null, tenantId)}>
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
        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${armed ? "border-[#583e30] bg-[#583e30] text-white" : "border-[#e8dfd5] bg-white text-[#735743] hover:border-[#cdb9a5] hover:bg-[#faf6f0]"}`}
      >
        <Archive size={16} /> {armed ? "Click again to archive" : "Archive tenant"}
      </button>
      {armed ? (
        <p id="archive-tenant-confirm-hint" role="status" className="mt-2 max-w-64 text-right text-xs leading-5 text-[#80766d]">
          Click again within 3.5 seconds. Bills and receipt history will be kept.
        </p>
      ) : null}
    </form>
  );
}
