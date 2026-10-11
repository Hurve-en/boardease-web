import { verifyAdmin } from "@/lib/dal";
import { signOut } from "@/app/login/actions";

export default async function DashboardPage() {
  const admin = await verifyAdmin();

  return (
    <main>
      <h1>test dashboard</h1>
      <p>testingss {admin.email}</p>

      <form action={signOut}>
        <button type="submit">Logout</button>
      </form>
    </main>
  );
}
