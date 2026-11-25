import BrandPanel from "@/app/components/BrandPanel";
import ForgotPasswordForm from "@/app/components/ForgotPasswordForm";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen min-[900px]:grid-cols-2">
      <BrandPanel />
      <section className="flex items-center justify-center bg-white px-6 py-12">
        <ForgotPasswordForm linkError={params.error} linkReason={params.reason} />
      </section>
    </main>
  );
}
