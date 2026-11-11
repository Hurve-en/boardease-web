
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { verifyAdmin } from "@/lib/dal";
import {AssignRoom, getTenantData} from "@/lib/tenants";

async function assignRoomAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  const hasRecord = formData.get("hasRecord") === "true";

  if (!id || !name || !roomId) {
    throw new Error("Select a tenant and a room before assigning.");
  }

  await AssignRoom({id, name, roomId, hasRecord});
}

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

            <h1 className="text-3xl">Tenants</h1>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th>Assignment</th>
                </tr>
              </thead>
              <tbody>
                {data.tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-bold">
                      {tenant.name}
                    </td>
                    <td>{tenant.roomNumber || "Unassigned"}</td>
                    <td>{tenant.status}</td>
                    <td>
                      <form action={assignRoomAction}>
                        <input type="hidden" name="id" value={tenant.id} />
                        <input type="hidden" name="name" value={tenant.name} />
                        <input
                          type="hidden"
                          name="hasRecord"
                          value={String(tenant.hasRecord)}
                        />
                        <select name="roomId" defaultValue="" required>
                          <option value="" disabled>
                            Select room
                          </option>
                          {data.AvailableRooms.map((room) => (
                            <option key={room.roomId} value={room.roomId}>
                              {room.roomNumber} ({room.monthlyRent}/month)
                            </option>
                          ))}
                        </select>
                        <button type="submit" disabled={!data.AvailableRooms.length}>
                          Assign room
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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