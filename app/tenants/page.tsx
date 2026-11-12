


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
        <section className="welcome-row">
          <div>
            <p className="eyebrow">PEOPLE IN YOUR PROPERTY</p>
            <h1>Tenants</h1>
            <p className="welcome-copy">
              Keep track of everyone living at Maple House.
            </p>
          </div>
        </section>


        
        <div>

     
            <div className="pt-50"/>

    
          <TenantTable tenants={data.tenants} rooms={data.AvailableRooms} />


        </div>
      </div>
    </DashboardShell>
  );
}
