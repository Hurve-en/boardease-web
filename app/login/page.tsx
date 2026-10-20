import BrandPanel from "@/app/components/BrandPanel";
import LoginForm from "@/app/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <BrandPanel />
      <section className="flex items-center justify-center bg-[#f7f3ec] p-8">
        <LoginForm />
      </section>
    </main>
  );
}