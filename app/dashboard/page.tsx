import { verifyAdmin } from "@/lib/dal";
import { getDashboardData } from "@/lib/dashboard";
import { resolveMonth } from "@/lib/payment-ui";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import DashboardView from "./DashboardView";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
	const admin = await verifyAdmin();
	const month = resolveMonth((await searchParams).month);
	const data = await getDashboardData(`${month}-01`);

	const firstName = admin.email.split("@")[0].split(/[._-]/)[0];
	const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

	return (
		<DashboardShell section="DASHBOARD">
			<DashboardView data={data} displayName={displayName} />
		</DashboardShell>
	);
}
