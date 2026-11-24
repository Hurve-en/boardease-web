import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
).origin;

export async function POST(request: NextRequest) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const pendingCookies: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }> = [];
  const pendingHeaders: Record<string, string> = {};

  const supabase = createServerClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        pendingCookies.push(...cookiesToSet);
        Object.assign(pendingHeaders, headersToSet);
      },
    },
  });

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${SITE_URL}/auth/confirm?next=/reset-password`,
  });

  console.log("PASSWORD RESET VERIFIER COOKIE CREATED:",
    pendingCookies.some((cookie) => cookie.name.includes("code-verifier")),
  );

  const response = error
    ? NextResponse.json(
        {
          ok: false,
          rateLimited:
            error.status === 429 || /rate limit|too many requests/i.test(error.message),
        },
        { status: error.status === 429 ? 429 : 200 },
      )
    : NextResponse.json({ ok: true });

  for (const cookie of pendingCookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  for (const [name, value] of Object.entries(pendingHeaders)) {
    response.headers.set(name, value);
  }

  if (error) {
    console.error("PASSWORD RESET REQUEST ERROR:", {
      name: error.name,
      message: error.message,
      status: error.status,
    });
  }

  return response;
}
