import Link from "next/link";
import { Archive } from "lucide-react";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { verifyAdmin } from "@/lib/dal";
import { getTenantData } from "@/lib/tenants";

import { TenantTable } from "@/app/tenants/tenant_table";

export default async function TenantsPage({ searchParams }: { searchParams: Promise<{ archive_error?: string; tenant_notice?: string }> }) {
  await verifyAdmin();
  const params = await searchParams;
  const notice = params.archive_error === "1" ? "archive_error" : params.tenant_notice;
  const data = await getTenantData();
  const currentTenants = data.tenants.filter((tenant) => tenant.status !== "archived");
  const archivedCount = data.tenants.length - currentTenants.length;

  return (
    <DashboardShell section="TENANTS">
      <div className="dashboard-content">
        <section className="tenant-page-heading">
          <div>
            <h1>Tenants</h1>
          </div>
          <Link href="/tenants/archived" className="tenant-archive-link">
            <Archive size={15} aria-hidden="true" />
            Archived
            <span className="tenant-archive-count">{archivedCount}</span>
          </Link>
        </section>
        {notice && (
          <p className={`tenant-action-feedback${notice === "archive_error" ? " is-error" : ""}`} role="status">
            {notice === "archived" ? (
              <>
                Tenant archived. Bills, payments, and receipts remain available in history.{" "}
                <Link href="/tenants/archived" className="tenant-feedback-link">View archived tenants</Link>
              </>
            ) : notice === "restored" ? "Tenant restored." : notice === "archive_error" ? "The tenant could not be updated. Refresh and try again." : null}
          </p>
        )}
        <TenantTable tenants={currentTenants} rooms={data.AvailableRooms} />
      </div>
    </DashboardShell>
  );
}
