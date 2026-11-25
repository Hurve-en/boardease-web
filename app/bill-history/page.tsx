import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, History } from "lucide-react";

import DashboardShell from "@/app/components/dashboard/DashboardShell";
import MonthPicker from "@/app/components/MonthPicker";
import { verifyAdmin } from "@/lib/dal";
import { billNumber } from "@/lib/bill-math";
import { getPaidBillHistory } from "@/lib/payment";
import { money, monthLabel, resolveMonth } from "@/lib/payment-ui";

const paidDate = (value: string | null) => value
  ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Manila" }).format(new Date(`${value.slice(0, 10)}T00:00:00+08:00`))
  : "—";

export default async function BillHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await verifyAdmin();
  const month = resolveMonth((await searchParams).month);
  const bills = await getPaidBillHistory(month);
  const total = bills.reduce((sum, bill) => sum + Number(bill.totalAmount || 0), 0);
  const label = monthLabel(month);

  return (
    <DashboardShell section="BILL_HISTORY">
      <div className="dashboard-content rooms-content">
        <section className="rooms-heading bill-history-heading">
          <div>
            <h1>Bill history</h1>
            <p className="welcome-copy">Fully paid bills for {label}.</p>
            <Link className="payments-history-link" href={`/payments?month=${month}`}>
              <ArrowLeft size={15} aria-hidden="true" />
              Back to payments
            </Link>
          </div>
          <MonthPicker month={month} />
        </section>

        <section className="room-stat-grid bill-history-stat-grid" aria-label="Paid bill summary">
          <article className="room-stat-card">
            <div className="room-stat-icon green">
              <CheckCircle2 size={16} aria-hidden="true" />
            </div>
            <div>
              <span>Fully paid bills</span>
              <strong>{bills.length}</strong>
            </div>
          </article>
          <article className="room-stat-card">
            <div className="room-stat-icon brown">
              <History size={16} aria-hidden="true" />
            </div>
            <div>
              <span>Amount settled</span>
              <strong>{money(total)}</strong>
            </div>
          </article>
        </section>

        <section className="room-list-panel panel payments-section" aria-labelledby="paid-bills-title">
          <div className="room-list-header">
            <div>
              <h2 id="paid-bills-title">Paid bills</h2>
              <p>Settled bills remain here for reference.</p>
            </div>
            <span className="be-badge is-paid">{bills.length} {bills.length === 1 ? "bill" : "bills"}</span>
          </div>
          <div className="rooms-table-wrap">
            <table className="rooms-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Room</th>
                  <th>Bill no.</th>
                  <th>Billing month</th>
                  <th>Paid on</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="payments-empty">
                      No fully paid bills for {label} yet.
                    </td>
                  </tr>
                ) : bills.map((bill) => (
                  <tr key={bill.billId}>
                    <td className="tenant-name">{bill.tenantName}</td>
                    <td className="muted-cell">{bill.roomNumber ?? "None"}</td>
                    <td className="muted-cell">{billNumber(bill.billingMonth, bill.roomNumber)}</td>
                    <td className="muted-cell">{label}</td>
                    <td className="muted-cell">{paidDate(bill.settledAt)}</td>
                    <td className="room-money">{money(bill.totalAmount)}</td>
                    <td><span className="be-badge is-paid">Paid</span></td>
                    <td>
                      <Link className="text-button" href={`/payments/${bill.billId}?month=${month}`}>
                        View <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
