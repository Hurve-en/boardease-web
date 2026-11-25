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
    <main className="grid min-h-screen min-[900px]:grid-cols-2 max-[899px]:flex max-[899px]:flex-col max-[899px]:justify-end max-[899px]:bg-(--be-brand-deep)">
      <BrandPanel />
      <section className="relative z-10 flex items-center justify-center bg-white px-6 py-12 max-[899px]:mt-[220px] max-[899px]:rounded-t-[28px] max-[899px]:pt-10">
        <ResetPasswordForm />
      </section>
    </main>
  );
}
