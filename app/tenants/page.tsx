


import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { verifyAdmin } from "@/lib/dal";
import {getTenantData} from "@/lib/tenants";

import { TenantTable } from "@/app/tenants/tenant_table";



export default async function TenantsPage() {
  const data = await getTenantData();
  await verifyAdmin();

  return (
    <DashboardShell section="TENANTS">
      <div className="dashboard-content">
        <section className="tenant-page-heading">
          <div>
            <h1>Tenants</h1>
            <p className="welcome-copy">
              Keep tenant details and room assignments together.
            </p>
          </div>
        </section>
        <TenantTable tenants={data.tenants} rooms={data.AvailableRooms} />
      </div>
    </DashboardShell>
  );
}
