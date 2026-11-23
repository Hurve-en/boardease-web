import AddRoom from "../AddRoom";
import { getBoardingHouses } from "@/lib/room";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { verifyAdmin } from "@/lib/dal";

export default async function AddRoomPage() {
  await verifyAdmin();
  return (
    <DashboardShell section="ROOMS">
      <AddRoom houses={await getBoardingHouses()} />
    </DashboardShell>
  );
}
