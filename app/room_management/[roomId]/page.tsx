import { notFound } from "next/navigation";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import RoomDetails from "../RoomDetails";
import { verifyAdmin } from "@/lib/dal";
import { getRoomDetails } from "@/lib/room_management";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  await verifyAdmin();
  const { roomId } = await params;
  const details = await getRoomDetails(roomId);

  if (!details) notFound();

  return (
    <DashboardShell section="ROOMS">
      <RoomDetails
        room={{
          id: details.room.roomId,
          identifier: details.room.roomNumber,
          monthly_rent: details.room.monthlyRent,
        }}
        property={{ name: "Maple House" }}
        tenant={
          details.tenant
            ? {
                full_name: `${details.tenant.firstName} ${details.tenant.lastName}`,
              }
            : null
        }
        assignment={
          details.tenant ? { start_date: details.tenant.startDate } : null
        }
        currentBill={details.currentBill}
      />
    </DashboardShell>
  );
}
