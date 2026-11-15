import DashboardShell from "@/app/components/dashboard/DashboardShell";
import {verifyAdmin} from "@/lib/dal";
import {getBillableTenants} from "@/lib/billing";
import CreateBillForm from "./CreateBillForm";

export default async function NewBillPage() {
	await verifyAdmin();
	const tenants = await getBillableTenants();
	return (
		<DashboardShell section="MONTHLY BILLS">
			<CreateBillForm tenants={tenants} />
		</DashboardShell>
	);
}
