import DashboardShell from "../components/dashboard/DashboardShell";
import { verifyAdmin } from "@/lib/dal";
import PaymentRoomList from "./record-payment-form";


export default async function PaymentPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string }>;
}){
    await verifyAdmin();
    const { month } = await searchParams;

    return(
        <DashboardShell section="PAYMENTS">
            <PaymentRoomList initialMonth={month} />
        </DashboardShell>
    );
}