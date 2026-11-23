import { notFound } from "next/navigation";
import { getBoardingHouses } from "@/lib/room";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import EditRoomForm from "@/app/room_management/EditRoom";
import { verifyAdmin } from "@/lib/dal";
import { getRoomDetails } from "@/lib/room_management";

export default async function EditRoomPage({
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
      <EditRoomForm
        houses={await getBoardingHouses()}
        room={{
          boardingHouseName: details.room.boardingHouseName,
          id: details.room.roomId,
          identifier: details.room.roomNumber,
          monthly_rent: details.room.monthlyRent,
          max_occupancy: details.room.maxOccupancy,
        }}
      />
    </DashboardShell>
  );
}
