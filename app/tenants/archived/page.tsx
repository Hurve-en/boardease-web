import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { restoreTenantAction } from "@/app/tenants/actions";
import { verifyAdmin } from "@/lib/dal";
import { getArchivedTenants } from "@/lib/tenants";

function displayDate(iso: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Manila",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function ArchivedTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ archive_error?: string; tenant_notice?: string }>;
}) {
  await verifyAdmin();
  const params = await searchParams;
  const notice = params.archive_error === "1" ? "archive_error" : params.tenant_notice === "restored" ? "restored" : null;
  const archived = await getArchivedTenants();

  return (
    <DashboardShell section="TENANTS">
      <div className="dashboard-content">
        <Link href="/tenants" className="tenant-back-link">
          <ArrowLeft size={15} aria-hidden="true" /> Tenants
        </Link>
        <section className="tenant-page-heading">
          <div>
            <h1>Archived tenants</h1>
            <p className="welcome-copy">
              Former tenants. Their bills, payments, and receipts stay in history.
            </p>
          </div>
        </section>

        {notice && (
          <p className={`tenant-action-feedback${notice === "archive_error" ? " is-error" : ""}`} role="status">
            {notice === "restored"
              ? "Tenant restored. They’re back in the tenants list and ready for a room."
              : "The tenant could not be updated. Refresh and try again."}
          </p>
        )}

        <section className="tenant-directory" aria-labelledby="archived-list-title">
          <div className="tenant-list-heading">
            <h2 id="archived-list-title">All archived</h2>
            <span className="tenants-count">
              {archived.length} {archived.length === 1 ? "tenant" : "tenants"}
            </span>
          </div>

          <div className="tenants-table-wrap">
            <table className="tenants-table">
              <thead>
                <tr>
                  <th>Tenant / contact</th>
                  <th>Last room</th>
                  <th>Archived</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {archived.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <span className="tenant-select">
                        <strong>{tenant.name || "Unnamed tenant"}</strong>
                        <span>{tenant.contactNumber || "Contact not provided"}</span>
                      </span>
                    </td>
                    <td>{tenant.lastRoomNumber ?? "—"}</td>
                    <td>{displayDate(tenant.archivedAt)}</td>
                    <td className="tenant-row-action">
                      <form action={restoreTenantAction.bind(null, tenant.id)}>
                        <input type="hidden" name="from" value="archived" />
                        <button
                          type="submit"
                          className="tenant-restore-button"
                          aria-label={`Restore ${tenant.name || "tenant"}`}
                        >
                          <RotateCcw size={14} aria-hidden="true" /> Restore
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {archived.length === 0 && (
                  <tr>
                    <td className="tenant-empty" colSpan={4}>
                      No archived tenants. Tenants you archive will show up here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
