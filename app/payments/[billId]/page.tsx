import DashboardShell from "../../components/dashboard/DashboardShell";
import { verifyAdmin } from "@/lib/dal";
import PaymentDetail from "../PaymentDetail";

export default async function PaymentDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ billId: string }>;
    searchParams: Promise<{ month?: string; proof?: string }>;
}){
    await verifyAdmin();
    const { billId } = await params;
    const { month, proof } = await searchParams;

    return(
        <DashboardShell section="PAYMENTS">
            <PaymentDetail billId={billId} month={month} proof={proof} />
        </DashboardShell>
    );
}