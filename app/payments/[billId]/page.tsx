import DashboardShell from "../../components/dashboard/DashboardShell";
import { verifyAdmin } from "@/lib/dal";
import PaymentDetail from "../PaymentDetail";

export default async function PaymentDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ billId: string }>;
    searchParams: Promise<{ month?: string }>;
}){
    await verifyAdmin();
    const { billId } = await params;
    const { month } = await searchParams;

    return(
        <DashboardShell section="PAYMENTS">
            <PaymentDetail billId={billId} month={month} />
        </DashboardShell>
    );
}