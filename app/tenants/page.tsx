
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { verifyAdmin } from "@/lib/dal";
import {getTenantData} from "@/lib/tenants";

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

            <h1 className = "text-3xl">Tenants</h1>
                {data.tenants.map((t) => (
            <tr key={t.id}>
                <td className = "px-6 py-4 whitespace-nowrap font-bold">{t.name}</td>
                <td>{t.roomNumber || "Unassigned"}</td>
                <td>{t.status}</td>
            </tr>
        ))}












        

            <div className="pt-50"/>

            <h1 className = "text-3xl">Available Rooms</h1>
            {data.AvailableRooms.map((room) => (
                <div key={room.roomId}>
                    <p>Room Number: {room.roomNumber}</p>
                    <p>Monthly Rent: {room.monthlyRent}</p>
                </div>
            ))}


        </div>
      </div>
    </DashboardShell>
  );
}