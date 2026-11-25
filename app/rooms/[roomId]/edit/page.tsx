import { notFound } from "next/navigation";
import { getBoardingHouses } from "@/lib/room";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import EditRoomForm from "@/app/room_management/EditRoom";
import { verifyAdmin } from "@/lib/dal";
import { getRoomDetails } from "@/lib/room_management";

export default async function EditRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ delete_error?: string }>;
}) {
  await verifyAdmin();
  const [{ roomId }, query] = await Promise.all([params, searchParams]);
  const details = await getRoomDetails(roomId);

  if (!details) notFound();

  return (
    <DashboardShell section="ROOMS">
      {query.delete_error ? (
        <p role="alert" className="mx-auto mt-6 w-full max-w-[1200px] px-8 text-sm text-red-700">
          This room could not be deleted while it has linked records.
        </p>
      ) : null}
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
