import "server-only";

import {createClient} from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL for server-side storage access.");
  }
  if (!secretKey) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY, SUPABASE_SECRET, or legacy SUPABASE_SERVICE_ROLE_KEY for server-side storage access.",
    );
  }

  return createClient(url, secretKey, {
    auth: {autoRefreshToken: false, persistSession: false},
  });
}
