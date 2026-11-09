"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { createBrowserClient } from "@supabase/ssr";

const inter = Inter({ subsets: ["latin"] });

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className={`${inter.className} flex min-h-screen bg-[#f7f3ec]`}>
      {/* Left panel */}
      <section className="relative hidden w-[49%] flex-col bg-[#3a2a21] px-[52px] py-[40px] text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e3cfb9] text-[#3a2a21]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
              <path d="M10 21v-6h4v6" />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight">
            BoardEase
          </span>
        </div>

        <div className="mt-[72px]">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#d9c7b4]">
            Maple House · Owner workspace
          </p>
          <h1 className="mt-4 text-[42px] font-semibold leading-[1.15] tracking-tight">
            A little less paperwork.
            <br />
            A lot more clarity.
          </h1>
          <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-[#d9c7b4]">
            Your rooms, tenants and monthly bills — together in one organized
            place.
          </p>
        </div>

        <div className="relative mt-10 aspect-[503/330] w-full max-w-[503px] overflow-hidden rounded-2xl">
          <Image
            src="/maple-house.jpg"
            alt="Maple House boarding house exterior"
            fill
            priority
            className="object-cover"
          />
        </div>

        <div className="mt-auto flex items-center gap-3 pt-10 text-[13px] text-[#d9c7b4]">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            <path d="M3 8V5a2 2 0 0 1 2-2h5" />
          </svg>
          Every bill accounted for. Every payment recorded.
        </div>
      </section>

      {/* Right panel */}
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[385px]">
          <span className="inline-block rounded-full bg-[#efe3d6] px-3 py-[6px] text-[10px] font-semibold uppercase tracking-wide text-[#6b4a36]">
            Owner / Admin
          </span>

          {sent ? (
            <>
              <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#efe3d6] text-[#5e3d2b]">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </div>
              <h2 className="mt-5 text-[30px] font-semibold tracking-tight text-[#2f2520]">
                Check your email
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#8a7f76]">
                If an account exists for{" "}
                <span className="font-semibold text-[#2f2520]">{email}</span>,
                we sent a link to reset your password.
              </p>

              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-8 text-[13px] font-semibold text-[#5e3d2b] hover:underline"
              >
                Use a different email
              </button>
            </>
          ) : (
            <>
              <h2 className="mt-5 text-[30px] font-semibold tracking-tight text-[#2f2520]">
                Forgot password?
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#8a7f76]">
                Enter your email and we&apos;ll send you a link to reset it.
              </p>

              <form onSubmit={handleSubmit} className="mt-8">
                <label
                  htmlFor="email"
                  className="block text-[13px] font-semibold text-[#2f2520]"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-[42px] w-full rounded-lg border border-[#e8e1d6] bg-white px-3.5 text-sm text-[#2f2520] outline-none transition focus:border-[#5e3d2b] focus:ring-2 focus:ring-[#5e3d2b]/20"
                />

                {error && (
                  <p role="alert" className="mt-4 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-[#5e3d2b] text-sm font-semibold text-white transition hover:bg-[#4d3123] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5e3d2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f3ec] disabled:opacity-70"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}

          <Link
            href="/login"
            className="mt-9 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5e3d2b] hover:underline"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5" />
              <path d="m11 18-6-6 6-6" />
            </svg>
            Back to sign in
          </Link>

          <p className="mt-9 text-[11px] text-[#8a7f76]">
            Secure access for owners and authorized administrators only.
          </p>
        </div>
      </section>
    </main>
  );
}