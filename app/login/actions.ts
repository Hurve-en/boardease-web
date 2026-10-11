"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CredentialsSchema } from "@/lib/definitions";

export type LoginState = {
  message: string;
  email: string;
};

export async function signIn(
  _prev: LoginState,
  form: FormData,
): Promise<LoginState> {
  const email = String(form.get("email") ?? "");

  const parsed = CredentialsSchema.safeParse({
    email,
    password: form.get("password"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0].message, email };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { message: "Wrong email or password.", email };
  }

  // UX only: the real protection is verifyAdmin() on every admin page/action
  const { data } = await supabase.auth.getClaims();
  const role = (data?.claims as { user_role?: string | null } | undefined)
    ?.user_role;

  if (role !== "admin") {
    await supabase.auth.signOut();
    return { message: "This portal is for administrators only.", email };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
