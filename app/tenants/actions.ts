"use server";

import { AssignRoom } from "@/lib/tenants";

export async function assignRoomAction(input: {
  tenant_Id: string;
  roomId: string;
  hasRecord: boolean;
  start_date: string;
  end_date: string;
  status: "active" | "inactive";
}) {
  return AssignRoom(input);
}
