import "server-only";

import { createClient } from "@/lib/supabase/server";

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
    const { data, error } = await supabase.auth.getClaims(token);
    const claims = data?.claims as
      | {
          sub?: string;
          email?: string;
          role?: string;
          user_role?: string | null;
        }
      | undefined;

    // Must be a real logged-in user, not the public anon key
    if (error || !claims?.sub || claims.role !== "authenticated") {
      return null;
    }

    // Role comes from the signed JWT (put there by the auth hook)
    const role = claims.user_role;
    if (role !== "admin" && role !== "tenant") return null;

    return { id: claims.sub, email: claims.email ?? "", role };
  } catch {
    return null; // any error = not logged in (fails closed)
  }
}
