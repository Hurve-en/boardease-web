"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import AuthMessage from "./auth/AuthMessage";
import { authInputClass, authPrimaryButtonClass, authSecondaryButtonClass } from "./auth/authStyles";
import ResetLinkErrorNotice from "./ResetLinkErrorNotice";

export default function ForgotPasswordForm({
  linkError = "",
  linkReason = "",
}: {
  linkError?: string;
  linkReason?: string;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(
          result.rateLimited
            ? "Too many reset requests. Please wait a little while before trying again."
            : "We couldn’t send the reset email right now. Please try again later.",
        );
        return;
      }
      setSent(true);
    } catch (cause) {
      console.error("PASSWORD RESET ACTION CALL FAILED:", cause);
      const reason = cause instanceof Error ? cause.message : String(cause);
      setError(
        process.env.NODE_ENV === "development"
          ? `We couldn’t connect to send the reset email. ${reason}`
          : "We couldn’t connect to send the reset email. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[340px]">

      {sent ? (
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-(--be-surface-selected) text-(--be-action-primary)">
            <MailCheck size={24} aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-(--be-text-primary)">
            Check your email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-(--be-text-muted)">
            If an account exists for <span className="font-medium text-(--be-text-primary)">{email}</span>, we sent a
            link to reset your password.
          </p>
          <button type="button" onClick={() => setSent(false)} className={`${authSecondaryButtonClass} mt-8`}>
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-center text-[26px] font-semibold tracking-[-0.02em] text-(--be-text-primary)">
            Forgot your password?
          </h1>
          <p className="mt-2 text-center text-sm text-(--be-text-muted)">
            Enter your email and we&apos;ll send you a link to reset it.
          </p>

          <div className="mt-8 space-y-4">
            <ResetLinkErrorNotice queryError={linkError} queryReason={linkReason} />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={authInputClass}
                />
              </div>

              {error && <AuthMessage type="error" message={error} />}

              <button type="submit" disabled={loading} aria-busy={loading} className={authPrimaryButtonClass}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </div>
        </>
      )}

      <Link
        href="/login"
        className="mx-auto mt-8 flex w-fit items-center gap-1.5 text-sm text-(--be-text-secondary) transition hover:text-(--be-action-primary)"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to sign in
      </Link>
    </div>
  );
}
