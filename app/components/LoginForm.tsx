"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TextField from "./auth/Textfield";
import AuthMessage from "./auth/AuthMessage";
import { signIn, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {
  message: "",
  email: "",
};

export default function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(signIn, initialState);

  useEffect(() => {
    if (!state.success) return;
    const t = setTimeout(() => router.push("/dashboard"), 1200);
    return () => clearTimeout(t);
  }, [state.success, router]);

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-3">
        <span className="inline-block rounded-full bg-[#efe3d5] px-3 py-1 text-xs font-medium uppercase text-[#3b271f]">
          Tenant Workspace
        </span>
        <h2 className="text-3xl font-semibold text-[#2b2623]">Welcome home.</h2>
        <p className="text-sm text-[#8a817a]">
          Sign in to view your monthly bills and recorded payments.
        </p>
      </div>

      <form action={action} className="space-y-5">
        <TextField
          id="email"
          name="email"
          label="Email address"
          type="email"
          placeholder="you@email.com"
          defaultValue={state.email}
          required
        />
        <TextField
          id="password"
          name="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          required
        />

        <Link
          href="/forgot-password"
          className="block text-xs font-medium text-[#613d2b]"
        >
          Forgot password?
        </Link>

        {state.message && (
          <AuthMessage
            type={state.success ? "success" : "error"}
            message={state.message}
          />
        )}

        <button
          type="submit"
          disabled={pending || state.success}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#613d2b] py-3 text-sm font-medium text-white transition hover:bg-[#4f3223] disabled:opacity-60"
        >
          <ArrowRight size={16} />
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <Link
        href="/register"
        className="block w-full rounded-lg border border-[#613d2b] py-3 text-center text-sm font-medium text-[#613d2b] transition hover:bg-[#efe3d5]"
      >
        Create an account
      </Link>

      <p className="text-xs text-[#8a817a]">
        Need an account? Ask your boarding-house owner for your sign-in details.
      </p>
      <p className="text-xs text-[#8a817a]">
        Secure access to your bills and recorded payments.
      </p>
    </div>
  );
}