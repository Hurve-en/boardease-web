import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { authorize } from "@/lib/api-auth";
import { inboxScope, listNotifications } from "@/lib/notifications";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "private, no-store",
};
export function OPTIONS() { return new Response(null, { status: 204, headers }); }

export async function GET(request: Request) {
  const auth = await authorize(request, ["admin", "tenant"]);
  if (!auth.user) return Response.json({ error: "Access denied" }, { status: auth.response.status, headers });
  const before = new URL(request.url).searchParams.get("before");
  const parsed = z.coerce.number().int().positive().optional().safeParse(before ?? undefined);
  if (!parsed.success) return Response.json({ error: "Invalid cursor" }, { status: 400, headers });
  return Response.json(await listNotifications(auth.user, parsed.data), { headers });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, ["admin", "tenant"]);
  if (!auth.user) return Response.json({ error: "Access denied" }, { status: auth.response.status, headers });
  const parsed = z.object({ id: z.number().int().positive() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid notification" }, { status: 400, headers });
  const [row] = await db.update(notifications).set({ readAt: sql`coalesce(${notifications.readAt}, now())` })
    .where(and(inboxScope(auth.user), eq(notifications.id, parsed.data.id))).returning({ id: notifications.id });
  return row ? Response.json(row, { headers }) : Response.json({ error: "Notification unavailable" }, { status: 404, headers });
}
