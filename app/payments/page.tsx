import DashboardShell from "../components/dashboard/DashboardShell";
import { verifyAdmin } from "@/lib/dal";
import { getPaymentsOverview } from "@/lib/payment";
import { resolveMonth } from "@/lib/payment-ui";
import PaymentsOverview from "./PaymentsOverview";
import PaymentRoomList from "./record-payment-form";

export default async function PaymentPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string }>;
}){
    await verifyAdmin();
    const month = resolveMonth((await searchParams).month);
    const { received, pending } = await getPaymentsOverview(month);

    return(
        <DashboardShell section="PAYMENTS">
            <PaymentsOverview month={month} received={received} pending={pending}>
                <PaymentRoomList key={month} initialMonth={month} />
            </PaymentsOverview>
        </DashboardShell>
    );
}
