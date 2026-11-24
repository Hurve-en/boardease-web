import { createBrowserClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient>;
let browserClient: BrowserSupabaseClient | undefined;

export function createClient() {
  browserClient ??= createBrowserClient(URL, PUBLISHABLE_KEY);
  return browserClient;
}
