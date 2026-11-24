"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/reset-password";
}

export default function AuthCompleteClient({
  code,
  next,
}: {
  code: string | null;
  next: string | null;
}) {
  const router = useRouter();
  const handled = useRef(false);
  const [message, setMessage] = useState("Verifying your reset link…");

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    if (!code) {
      router.replace("/forgot-password?error=missing_token");
      return;
    }

    void (async () => {
      const { error } = await createClient().auth.exchangeCodeForSession(code);
      console.error("EXCHANGE CODE ERROR:", {
        name: error?.name ?? null,
        message: error?.message ?? null,
      });

      if (error) {
        const destination = new URL("/forgot-password", window.location.origin);
        destination.searchParams.set("error", "verify_failed");
        if (process.env.NODE_ENV === "development") {
          destination.searchParams.set("reason", error.message);
        }
        router.replace(`${destination.pathname}${destination.search}`);
        return;
      }

      router.replace(safeNext(next));
    })().catch((error: unknown) => {
      const reason = error instanceof Error ? error.message : String(error);
      console.error("EXCHANGE CODE ERROR:", {
        name: error instanceof Error ? error.name : "UnknownError",
        message: reason,
      });
      setMessage("We couldn’t verify that link. Request a new one below.");
      router.replace("/forgot-password?error=verify_failed");
    });
  }, [code, next, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3ec] px-6 text-sm text-[#5e3d2b]">
      {message}
    </main>
  );
}
