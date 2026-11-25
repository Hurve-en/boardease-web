"use server";

import { verifyAdmin } from "@/lib/dal";
import { redirect } from "next/navigation";
import {
  EditRoomDetails as updateRoomDetails,
  EndRoomAssignment,
  DeleteRoom,
  type UpdateActionState,
} from "@/lib/room_management";

export async function editRoomDetails(
  previousState: UpdateActionState,
  formData: FormData,
): Promise<UpdateActionState> {
  await verifyAdmin();
  const result = await updateRoomDetails(previousState, formData);

  if (result.success) {
    redirect(`/room_management/${String(formData.get("roomId"))}`);
  }

  return result;
}

export async function endRoomAssignment(formData: FormData) {
  const roomId = String(formData.get("roomId") ?? "");
  if (!roomId) throw new Error("Room id is required.");

  await EndRoomAssignment(roomId);
  redirect(`/room_management/${roomId}`);
}

export async function deleteRoomAction(roomId: string, formData: FormData) {
  void formData;
  await verifyAdmin();
  if (!roomId.trim()) throw new Error("Room id is required.");

  const result = await DeleteRoom(roomId);
  if (!result.success) {
    redirect(`/rooms/${encodeURIComponent(roomId)}/edit?delete_error=1`);
  }

  redirect("/rooms");
}
