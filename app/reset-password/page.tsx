import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BrandPanel from "@/app/components/BrandPanel";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password?error=missing_session");
  }

  return (
    <main className="grid min-h-screen min-[900px]:grid-cols-2">
      <BrandPanel />
      <section className="flex items-center justify-center bg-white px-6 py-12">
        <ResetPasswordForm />
      </section>
    </main>
  );
}
