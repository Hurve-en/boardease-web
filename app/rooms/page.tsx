import { verifyAdmin } from "@/lib/dal";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import RoomsClient from "./rooms-client";

export default async function RoomsPage() {
  await verifyAdmin();
  return (
    <DashboardShell section="ROOMS">
      <RoomsClient />
    </DashboardShell>
  );
}
