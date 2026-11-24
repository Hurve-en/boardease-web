import ForgotPasswordForm from "@/app/components/ForgotPasswordForm";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string }>;
}) {
  const params = await searchParams;
  return <ForgotPasswordForm linkError={params.error} linkReason={params.reason} />;
}
