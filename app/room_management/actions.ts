"use server";

import { redirect } from "next/navigation";
import {
  EditRoomDetails as updateRoomDetails,
  EndRoomAssignment,
  type UpdateActionState,
} from "@/lib/room_management";

export async function editRoomDetails(
  previousState: UpdateActionState,
  formData: FormData,
): Promise<UpdateActionState> {
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
