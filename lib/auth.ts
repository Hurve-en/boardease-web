import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/tenant-info";

export type Role = "admin" | "tenant";

export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
};

// Pass `request` for API calls (mobile sends a Bearer token).
// Pass nothing for web pages (uses the cookie session).
export async function getCurrentUser(
  request?: Request,
): Promise<CurrentUser | null> {
  try {
    let token: string | undefined;

    const header = request?.headers.get("Authorization");
    if (header) {
      if (!header.startsWith("Bearer ")) return null;
      token = header.slice("Bearer ".length).trim();
      if (!token) return null;
    }

    const supabase = await createClient();
    const { data, error } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();
    const user = data.user;

    if (error || !user) {
      return null;
    }

    const role = await getUserRole(user.id);
    if (role !== "admin" && role !== "tenant") return null;

    return { id: user.id, email: user.email ?? "", role };
  } catch {
    return null; // any error = not logged in (fails closed)
  }
}
