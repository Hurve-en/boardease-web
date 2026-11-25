import Link from "next/link";
import { ArrowRight, Banknote, FileCheck2, History, ReceiptText } from "lucide-react";
import { billNumber } from "@/lib/bill-math";
import type { PendingProof, ReceivedPayment } from "@/lib/payment";
import { PAYMENTS_PATH, dateTime, money, monthLabel } from "@/lib/payment-ui";
import MonthPicker from "@/app/components/MonthPicker";

const dayLabel = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Manila" }).format(
    new Date(`${value.slice(0, 10)}T00:00:00+08:00`),
  );

type PaymentsOverviewProps = {
  month: string;
  received: ReceivedPayment[];
  pending: PendingProof[];
  children: React.ReactNode;
};

export default function PaymentsOverview({ month, received, pending, children }: PaymentsOverviewProps) {
  const receivedTotal = received.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const pendingTotal = pending.reduce((sum, proof) => sum + (Number(proof.amount) || 0), 0);
  const label = monthLabel(month);

  return (
    <div className="dashboard-content rooms-content">
      <section className="rooms-heading">
        <div>
          <h1>Payments</h1>
          <Link className="payments-history-link" href={`/bill-history?month=${month}`}>
            <History size={15} aria-hidden="true" />
            View bill history
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <MonthPicker month={month} />
      </section>

      <section className="room-stat-grid" aria-label="Payment summary">
        <article className="room-stat-card">
          <div className="room-stat-icon green">
            <Banknote size={16} aria-hidden="true" />
          </div>
          <div>
            <span>Received for {label}</span>
            <strong>{money(receivedTotal)}</strong>
          </div>
        </article>
        <article className="room-stat-card">
          <div className="room-stat-icon brown">
            <ReceiptText size={16} aria-hidden="true" />
          </div>
          <div>
            <span>Payments recorded</span>
            <strong>{received.length}</strong>
          </div>
        </article>
        <article className="room-stat-card">
          <div className="room-stat-icon sand">
            <FileCheck2 size={16} aria-hidden="true" />
          </div>
          <div>
            <span>Proofs to review</span>
            <strong>{pending.length}</strong>
          </div>
        </article>
      </section>

      {pending.length > 0 && (
        <section className="room-list-panel panel payments-section" aria-labelledby="proofs-title">
          <div className="room-list-header">
            <div>
              <h2 id="proofs-title">Proofs to review</h2>
            </div>
            <span className="be-badge is-pending">{money(pendingTotal)} waiting</span>
          </div>
          <div className="rooms-table-wrap">
            <table className="rooms-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Room</th>
                  <th>Bill no.</th>
                  <th>Amount</th>
                  <th>Reference</th>
                  <th>Submitted</th>
                  <th aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {pending.map((proof) => (
                  <tr key={proof.submissionId}>
                    <td className="tenant-name">{proof.tenantName}</td>
                    <td className="muted-cell">{proof.roomNumber ?? "None"}</td>
                    <td className="muted-cell">{billNumber(proof.billingMonth, proof.roomNumber)}</td>
                    <td className="room-money">{money(proof.amount)}</td>
                    <td className="muted-cell">{proof.referenceNumber}</td>
                    <td className="muted-cell">{dateTime(proof.submittedAt)}</td>
                    <td>
                      <Link
                        className="text-button"
                        href={`${PAYMENTS_PATH}/${proof.billId}?month=${proof.billingMonth.slice(0, 7)}`}
                      >
                        Review <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="room-list-panel panel payments-section" aria-labelledby="received-title">
        <div className="room-list-header">
          <div>
            <h2 id="received-title">Payments received on open bills</h2>
          </div>
          <span className="be-badge is-neutral">{label}</span>
        </div>
        <div className="rooms-table-wrap">
          <table className="rooms-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Tenant</th>
                <th>Room</th>
                <th>Bill no.</th>
                <th>Amount</th>
                <th aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              {received.length === 0 ? (
                <tr>
                  <td colSpan={6} className="payments-empty">
                    No payments recorded for open bills in {label}.
                  </td>
                </tr>
              ) : (
                received.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td className="muted-cell">{dayLabel(payment.paymentDate)}</td>
                    <td className="tenant-name">{payment.tenantName}</td>
                    <td className="muted-cell">{payment.roomNumber ?? "None"}</td>
                    <td className="muted-cell">{billNumber(payment.billingMonth, payment.roomNumber)}</td>
                    <td className="room-money">{money(payment.amount)}</td>
                    <td>
                      <Link className="text-button" href={`${PAYMENTS_PATH}/${payment.billId}?month=${month}`}>
                        View <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="payments-section">{children}</div>
    </div>
  );
}
