import AuthCompleteClient from "./AuthCompleteClient";

export default async function AuthCompletePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : null;
  const next = typeof params.next === "string" ? params.next : null;
  return (
    <AuthCompleteClient code={code} next={next} />
  );
}
