"use server";

import { AssignRoom } from "@/lib/tenants";
import { setTenantArchived } from "@/lib/tenants";
import { verifyAdmin } from "@/lib/dal";
import { redirect } from "next/navigation";

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

export async function archiveTenantAction(tenantId: string, formData: FormData) {
  void formData;
  await verifyAdmin();
  const result = await setTenantArchived(tenantId, true);
  if (!result.success) redirect("/tenants?archive_error=1");
  redirect("/tenants?tenant_notice=archived");
}

export async function restoreTenantAction(tenantId: string, formData: FormData) {
  await verifyAdmin();
  const base = formData.get("from") === "archived" ? "/tenants/archived" : "/tenants";
  const result = await setTenantArchived(tenantId, false);
  if (!result.success) redirect(`${base}?archive_error=1`);
  redirect(`${base}?tenant_notice=restored`);
}
