import BrandPanel from "@/app/components/BrandPanel";
import LoginForm from "@/app/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ password_reset?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen min-[900px]:grid-cols-2">
      <BrandPanel />
      <section className="flex items-center justify-center bg-white px-6 py-12">
        <LoginForm passwordResetSuccess={params.password_reset === "success"} />
      </section>
    </main>
  );
}
