import BrandPanel from "@/app/components/BrandPanel";
import LoginForm from "@/app/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ password_reset?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <BrandPanel />
      <section className="flex items-center justify-center bg-[#f7f3ec] p-8">
        <LoginForm passwordResetSuccess={params.password_reset === "success"} />
      </section>
    </main>
  );
}
