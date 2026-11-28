import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { pushTokens } from "@/drizzle/schema";
import { authorize } from "@/lib/api-auth";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "private, no-store",
};
export function OPTIONS() { return new Response(null, { status: 204, headers }); }

const body = z.object({
  token: z.string().regex(/^Expo(nent)?PushToken\[.+\]$/),
  platform: z.enum(["ios", "android"]).optional(),
});

export async function POST(request: Request) {
  const auth = await authorize(request, ["admin", "tenant"]);
  if (!auth.user) return Response.json({ error: "Access denied" }, { status: auth.response.status, headers });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid token" }, { status: 400, headers });

  const { token, platform } = parsed.data;
  await db.insert(pushTokens)
    .values({ token, userId: auth.user.id, platform })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { userId: auth.user.id, platform, updatedAt: sql`now()` },
    });
  return Response.json({ ok: true }, { headers });
}

// call on logout so the next person on the device doesn't get this user's alerts
export async function DELETE(request: Request) {
  const auth = await authorize(request, ["admin", "tenant"]);
  if (!auth.user) return Response.json({ error: "Access denied" }, { status: auth.response.status, headers });
  const parsed = body.pick({ token: true }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid token" }, { status: 400, headers });

  await db.delete(pushTokens).where(and(eq(pushTokens.token, parsed.data.token), eq(pushTokens.userId, auth.user.id)));
  return Response.json({ ok: true }, { headers });
}