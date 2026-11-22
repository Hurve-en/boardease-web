import DashboardShell from "../components/dashboard/DashboardShell";
import { verifyAdmin } from "@/lib/dal";
import RecordPaymentForm from "./record-payment-form";

export default async function PaymentPage(){
    await verifyAdmin();

    return(
        <DashboardShell section="PAYMENTS">
            <RecordPaymentForm/>
        </DashboardShell>
    );
}