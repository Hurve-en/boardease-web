import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const ORIGIN = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
).origin;
let confirmHitCount = 0;

function failure(error: string, reason?: string) {
  const destination = new URL("/forgot-password", ORIGIN);
  destination.searchParams.set("error", error);
  if (reason && process.env.NODE_ENV === "development") {
    destination.searchParams.set("reason", reason);
  }
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  confirmHitCount += 1;
  console.log("CONFIRM HIT", {
    count: confirmHitCount,
    timestamp: new Date().toISOString(),
  });
  const cookieStore = await cookies();
  console.log(
    "CONFIRM VERIFIER COOKIE PRESENT:",
    cookieStore.getAll().some((cookie) => cookie.name.includes("code-verifier")),
  );

  const params = new URL(request.url).searchParams;
  const token_hash = params.get("token_hash");
  const type = params.get("type");
  const code = params.get("code");
  const authError = params.get("error");
  const errorCode = params.get("error_code");
  const requestedNext = params.get("next") ?? "/reset-password";
  const next = requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//") &&
    !requestedNext.includes("\\")
    ? requestedNext
    : "/reset-password";

  console.log("CONFIRM PARAMS:", {
    hasTokenHash: !!token_hash,
    hasCode: !!code,
    type,
    next,
  });

  if (authError || errorCode) {
    const message = `${authError ?? "auth_error"}: ${errorCode ?? "unknown"}`;
    console.error("CONFIRM URL ERROR:", { name: authError, message });
    return failure("verify_failed", message);
  }

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash,
    });
    console.error("VERIFY OTP ERROR:", {
      name: error?.name ?? null,
      message: error?.message ?? null,
    });
    if (error) return failure("verify_failed", error.message);
    return NextResponse.redirect(new URL(next, ORIGIN));
  }

  if (code) {
    // PKCE verifier cookies are browser-owned. Complete this exchange in the
    // browser so Supabase can read the verifier created by the reset request.
    const destination = new URL("/auth/complete", ORIGIN);
    destination.searchParams.set("code", code);
    destination.searchParams.set("next", next);
    return NextResponse.redirect(destination);
  }

  console.error("CONFIRM ERROR:", {
    name: "MissingAuthParameters",
    message: "Neither token_hash nor code was present.",
  });
  return failure("missing_token");
}
