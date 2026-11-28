"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthMessage from "./auth/AuthMessage";
import PasswordField from "./auth/PasswordField";
import { authInputClass, authPrimaryButtonClass } from "./auth/authStyles";
import { signIn, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {
  message: "",
  email: "",
};

export default function LoginForm({
  passwordResetSuccess = false,
}: {
  passwordResetSuccess?: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(signIn, initialState);
  const [email, setEmail] = useState(
    () =>
      typeof window === "undefined"
        ? initialState.email
        : window.localStorage.getItem("boardease-remembered-email") ?? "",
  );
  const [rememberMe, setRememberMe] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.localStorage.getItem("boardease-remembered-email")),
  );

  useEffect(() => {
    if (!state.success) return;

    if (rememberMe && state.email) {
      window.localStorage.setItem("boardease-remembered-email", state.email);
    } else {
      window.localStorage.removeItem("boardease-remembered-email");
    }

    const t = setTimeout(() => router.push("/dashboard"), 1200);
    return () => clearTimeout(t);
  }, [state.success, state.email, rememberMe, router]);

  return (
    <div className="w-full max-w-[340px]">
      <h1 className="text-center text-[26px] font-semibold tracking-[-0.02em] text-(--be-text-primary)">
        Sign in to BoardEase
      </h1>
      <p className="mt-2 text-center text-sm text-(--be-text-muted)">For boarding-house owners and admins</p>

      <div className="mt-8 space-y-4">
        {passwordResetSuccess && (
          <AuthMessage
            type="success"
            message="Your password was reset. Sign in with your new password."
          />
        )}

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className={authInputClass}
            />
          </div>

          <PasswordField id="password" name="password" label="Password" autoComplete="current-password" required />

          <div className="flex items-center justify-between px-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-(--be-text-primary)">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 cursor-pointer rounded-full accent-(--be-action-primary)"
              />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-(--be-text-secondary) underline underline-offset-4 transition hover:text-(--be-action-primary)"
            >
              Forgot password?
            </Link>
          </div>

          {state.message && (
            <AuthMessage
              type={state.success ? "success" : "error"}
              message={state.message}
            />
          )}

          <button
            type="submit"
            disabled={pending || state.success}
            aria-busy={pending}
            className={authPrimaryButtonClass}
          >
            {pending ? "Signing in…" : state.success ? "Signed in" : "Sign in"}
          </button>
        </form>
      </div>

      <p className="mt-8 text-center text-sm text-(--be-text-muted)">
        Need an account? Your BoardEase administrator sets up owner accounts.
      </p>
    </div>
  );
}
