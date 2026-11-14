import DashboardShell from "@/app/components/dashboard/DashboardShell";
import {verifyAdmin} from "@/lib/dal";
import BillsClient from "./bills-client";

export default async function MonthlyBillsPage() {
	await verifyAdmin();
	return (
		<DashboardShell section="MONTHLY BILLS">
			<BillsClient />
		</DashboardShell>
	);
}
