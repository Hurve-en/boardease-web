"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmation) {
      setError("Those passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
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
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3ec] px-6 py-12">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <span className="inline-block rounded-full bg-[#efe3d6] px-3 py-[6px] text-[10px] font-semibold uppercase tracking-wide text-[#6b4a36]">
          Owner / Admin
        </span>
        <>
            <h1 className="mt-5 text-3xl font-semibold text-[#2f2520]">Choose a new password</h1>
            <p className="mt-2 text-sm text-[#8a7f76]">Enter and confirm your new password below.</p>
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="password" className="block text-[13px] font-semibold text-[#2f2520]">New password</label>
                <div className="relative mt-2">
                  <input id="password" type={passwordVisible ? "text" : "password"} autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="h-[42px] w-full rounded-lg border border-[#e8e1d6] px-3.5 pr-12 text-sm outline-none focus:border-[#5e3d2b] focus:ring-2 focus:ring-[#5e3d2b]/20" />
                  <button type="button" aria-label={passwordVisible ? "Hide new password" : "Show new password"} aria-pressed={passwordVisible} onClick={() => setPasswordVisible((visible) => !visible)} className="absolute inset-y-0 right-2 flex w-9 items-center justify-center rounded-md text-[#675c52] hover:bg-[#f7f3ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#613d2b]/40">
                    {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmation" className="block text-[13px] font-semibold text-[#2f2520]">Confirm new password</label>
                <div className="relative mt-2">
                  <input id="confirmation" type={confirmationVisible ? "text" : "password"} autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-[42px] w-full rounded-lg border border-[#e8e1d6] px-3.5 pr-12 text-sm outline-none focus:border-[#5e3d2b] focus:ring-2 focus:ring-[#5e3d2b]/20" />
                  <button type="button" aria-label={confirmationVisible ? "Hide password confirmation" : "Show password confirmation"} aria-pressed={confirmationVisible} onClick={() => setConfirmationVisible((visible) => !visible)} className="absolute inset-y-0 right-2 flex w-9 items-center justify-center rounded-md text-[#675c52] hover:bg-[#f7f3ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#613d2b]/40">
                    {confirmationVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </div>
              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={loading} className="flex h-[42px] w-full items-center justify-center rounded-lg bg-[#5e3d2b] text-sm font-semibold text-white hover:bg-[#4d3123] disabled:opacity-70">{loading ? "Updating…" : "Update password"}</button>
            </form>
        </>
      </section>
    </main>
  );
}
