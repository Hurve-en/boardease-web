


import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { verifyAdmin } from "@/lib/dal";
import {getTenantData} from "@/lib/tenants";

import { TenantTable } from "@/app/tenants/tenant_table";



export default async function TenantsPage({ searchParams }: { searchParams: Promise<{ archive_error?: string; tenant_notice?: string }> }) {
  const params = await searchParams;
  const notice = params.archive_error === "1" ? "archive_error" : params.tenant_notice;
  const data = await getTenantData();
  await verifyAdmin();

  return (
    <DashboardShell section="TENANTS">
      <div className="dashboard-content">
        <section className="tenant-page-heading">
          <div>
            <h1>Tenants</h1>
          </div>
        </section>
        {notice && (
          <p className={`tenant-action-feedback${notice === "archive_error" ? " is-error" : ""}`} role="status">
            {notice === "archived" ? "Tenant archived. Bills, payments, and receipts remain available in history." : notice === "restored" ? "Tenant restored." : notice === "archive_error" ? "The tenant could not be updated. Refresh and try again." : null}
          </p>
        )}
        <TenantTable tenants={data.tenants} rooms={data.AvailableRooms} />
      </div>
    </DashboardShell>
  );
}
