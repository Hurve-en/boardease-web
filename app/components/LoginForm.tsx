"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TextField from "./auth/Textfield";

import {useActionState} from "react";
import {signIn, type LoginState} from "../login/actions";

const initialState: LoginState = {
    message: "",
    email: "",
};



export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

   const [state, action, pending] = useActionState(signIn, initialState);
  
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: hook up your real auth here
    console.log({ email, password });
  }

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

      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          id="email"
          label="Email address"
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Link href="/forgot-password" className="block text-xs font-medium text-[#613d2b]">
          Forgot password?
        </Link>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#613d2b] py-3 text-sm font-medium text-white transition hover:bg-[#4f3223]"
        >
          <ArrowRight size={16} />
          Sign in
        </button>
      </form>

      {/* Registration button */}
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