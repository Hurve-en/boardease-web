import AddRoom from "../AddRoom";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { verifyAdmin } from "@/lib/dal";

export default async function AddRoomPage() {
  await verifyAdmin();
  return (
    <DashboardShell section="ROOMS">
      <AddRoom />
    </DashboardShell>
  );
}
