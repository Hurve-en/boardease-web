import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { pushTokens } from "@/drizzle/schema";

type PushNotice = {
  id: number;
  recipientId: string;
  billId: string;
  title: string;
  body: string;
};

type ExpoTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

export async function sendPushForNotice(n: PushNotice) {
  try {
    const rows = await db.select({ token: pushTokens.token })
      .from(pushTokens).where(eq(pushTokens.userId, n.recipientId));
    const tokens = rows.map((r) => r.token);
    if (!tokens.length) return;

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(tokens.map((to) => ({
        to,
        title: n.title,
        body: n.body,
        sound: "default",
        data: { noticeId: n.id, billId: n.billId },
      }))),
    });
    if (!res.ok) return;

    const json = (await res.json()) as { data?: ExpoTicket[] };
    const tickets = json.data ?? [];

    const dead = tickets
      .map((t, i) =>
        t.status === "error" && t.details?.error === "DeviceNotRegistered" ? tokens[i] : null)
      .filter((t): t is string => t !== null);

    if (dead.length) await db.delete(pushTokens).where(inArray(pushTokens.token, dead));
  } catch (e) {
    console.error("push failed", e); // a failed push should never break the request
  }
}