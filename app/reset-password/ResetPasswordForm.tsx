"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import AuthMessage from "@/app/components/auth/AuthMessage";
import PasswordField from "@/app/components/auth/PasswordField";
import { authPrimaryButtonClass } from "@/app/components/auth/authStyles";

const MIN_LENGTH = 8;

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const longEnough = password.length >= MIN_LENGTH;
  const matches = confirmation.length > 0 && password === confirmation;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmation) {
      setError("Those passwords do not match.");
      return;
    }
    if (password.length < MIN_LENGTH) {
      setError(`Choose a password with at least ${MIN_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("We couldn’t update your password. Please request a new reset link and try again.");
      } else {
        router.replace("/login?password_reset=success");
      }
    } catch {
      setError("We couldn’t connect to update your password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[340px]">
      <h1 className="text-center text-[26px] font-semibold tracking-[-0.02em] text-(--be-text-primary)">
        Choose a new password
      </h1>
      <p className="mt-2 text-center text-sm text-(--be-text-muted)">
        You&apos;ll use it the next time you sign in.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <PasswordField
          id="password"
          label="New password"
          autoComplete="new-password"
          minLength={MIN_LENGTH}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby="password-rules"
        />
        <PasswordField
          id="confirmation"
          label="Confirm new password"
          autoComplete="new-password"
          required
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          aria-describedby="password-rules"
        />

        <ul id="password-rules" className="space-y-1.5 px-1 text-sm">
          <Rule met={longEnough}>At least {MIN_LENGTH} characters</Rule>
          <Rule met={matches}>Both passwords match</Rule>
        </ul>

        {error && <AuthMessage type="error" message={error} />}

        <button type="submit" disabled={loading} aria-busy={loading} className={authPrimaryButtonClass}>
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>

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

function Rule({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-2 ${met ? "text-(--be-success-text)" : "text-(--be-text-muted)"}`}>
      <span
        className={`grid h-4 w-4 place-items-center rounded-full ${
          met ? "bg-(--be-success-surface)" : "border border-(--be-border-strong)"
        }`}
        aria-hidden="true"
      >
        {met && <Check size={11} strokeWidth={3} />}
      </span>
      {children}
      <span className="sr-only">{met ? "(done)" : "(not yet)"}</span>
    </li>
  );
}
