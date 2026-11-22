import {notFound} from "next/navigation";
import {z} from "zod";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import {verifyAdmin} from "@/lib/dal";
import {getBillDetails} from "@/lib/billing";
import EditBillForm from "./EditBillForm";

export default async function EditBillPage(
	props: PageProps<"/monthly-bills/[billId]/edit">,
) {
	await verifyAdmin();

	const {billId} = await props.params;
	if (!z.uuid().safeParse(billId).success) notFound();

	const details = await getBillDetails(billId);
	if (!details) notFound();

	const {bill, payments} = details;
	const paidCents = payments.reduce(
		(sum, p) => sum + Math.round(Number(p.amount) * 100),
		0,
	);

	return (
		<DashboardShell section="MONTHLY BILLS">
			<EditBillForm
				bill={{
					billId: bill.billId,
					tenantName: bill.tenantName,
					roomNumber: bill.roomNumber,
					billingMonth: bill.billingMonth,
					dueDate: bill.dueDate,
					rentAmount: bill.rentAmount,
					electricCharge: bill.electricCharge,
					waterCharge: bill.waterCharge,
				}}
				paid={(paidCents / 100).toFixed(2)}
			/>
		</DashboardShell>
	);
}
