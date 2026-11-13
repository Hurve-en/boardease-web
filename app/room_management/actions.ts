"use server";

import { redirect } from "next/navigation";
import {
  EditRoomDetails as updateRoomDetails,
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
