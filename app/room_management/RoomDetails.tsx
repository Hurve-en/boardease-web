import Link from "next/link";
import styles from "./RoomDetails.module.css";

export type RoomDetailsProps = {
  room: {
    id: string;
    identifier: string;
    monthly_rent: number;
    max_occupancy?: number;
  };
  property: { name: string };
  tenant?: { full_name: string } | null;
  assignment?: { start_date: string } | null;
  currentBill?: {
    totalAmount: number;
    outstandingBalance: number;
    status: string;
    dueDate: string;
  } | null;
};

const php = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n);

const day = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const PersonIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" style={{ width: 18, height: 18 }} aria-hidden>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

export default function RoomDetails({
  room,
  property,
  tenant,
  assignment,
  currentBill,
}: RoomDetailsProps) {
  const occupied = !!(tenant && assignment);
  const chipClass = `${styles.chip} ${occupied ? "" : styles.chipAvailable}`;
  const statusLabel = occupied ? "Occupied" : "Available";
  const assignHref = `/tenants?room=${room.id}`;

  return (
    <div className={styles.root}>
      <main className={styles.main}>
        <div className={styles.head}>
          <div>
            <h1 className={styles.title}>{room.identifier}</h1>
            <div className={styles.sub}>{property.name} · Room details</div>
          </div>
          <Link className={styles.btn} href={`/rooms/${room.id}/edit`}>
            Edit room
          </Link>
        </div>

        <div className={styles.grid}>
          <div className={styles.stack}>
            <section className={styles.card} aria-labelledby="assign-h">
              <h2 id="assign-h">Current assignment</h2>
              <p className={styles.desc}>The tenant currently assigned to this room.</p>

              <div className={styles.tenant}>
                <div className={styles.avatar}><PersonIcon /></div>
                <div>
                  <div className={styles.name}>{occupied ? tenant!.full_name : "No tenant assigned"}</div>
                  <div className={styles.role}>{occupied ? "Current tenant" : "This room is open for a new tenant."}</div>
                </div>
                <span className={chipClass}>{statusLabel}</span>
              </div>

              <dl className={styles.rows}>
                <div className={styles.row}>
                  <dt>Assignment start</dt>
                  <dd>{occupied ? day(assignment!.start_date) : "—"}</dd>
                </div>
                <div className={styles.row}>
                  <dt>Occupancy</dt>
                  <dd>{occupied ? "Occupied · tenant assigned" : "Available · no tenant"}</dd>
                </div>
              </dl>

              <div className={styles.foot}>
                <span>Managed in Tenants and room assignment.</span>
                <Link className={`${styles.btn} ${styles.btnLg}`} href={assignHref}>Manage assignment →</Link>
              </div>
            </section>

            <section className={styles.card} aria-labelledby="bill-h">
              <h2 id="bill-h">Monthly billing</h2>
              <p className={styles.desc}>The room’s monthly rent is used when creating a bill.</p>
              <dl className={`${styles.rows} ${styles.rowsPlain}`}>
                <div className={styles.row}>
                  <dt>Monthly rent (PHP)</dt>
                  <dd>{php(room.monthly_rent)}</dd>
                </div>
                {currentBill && (
                  <>
                    <div className={styles.row}>
                      <dt>Current bill</dt>
                      <dd>{php(currentBill.totalAmount)}</dd>
                    </div>
                    <div className={styles.row}>
                      <dt>Outstanding</dt>
                      <dd>{php(currentBill.outstandingBalance)}</dd>
                    </div>
                  </>
                )}
              </dl>
              <p className={styles.footText}>
                To update the room identifier or monthly rent, choose Edit room. Tenant assignment stays unchanged.
              </p>
            </section>
          </div>

          <aside className={styles.stack} aria-label="Room summary">
            <div className={`${styles.card} ${styles.summary}`}>
              <div className={styles.summaryTop}>
                <h3>{room.identifier}</h3>
                <svg className={`${styles.icon} ${styles.door}`} viewBox="0 0 24 24" aria-hidden>
                  <path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17M2 21h20M18 21V9h-3" />
                  <circle cx="11" cy="12.5" r=".6" fill="currentColor" />
                </svg>
              </div>
              <span className={chipClass}>{statusLabel}</span>
              <div className={styles.who}>{occupied ? tenant!.full_name : "No tenant assigned"}</div>
              {occupied && <div className={styles.since}>Since {day(assignment!.start_date)}</div>}
              <hr />
              <div className={styles.lbl}>Monthly rent</div>
              <div className={styles.rent}>{php(room.monthly_rent)}</div>
              <Link className={styles.link} href={assignHref}>Manage assignment →</Link>
            </div>

            <div className={styles.note} role="note">
              <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5M12 8h.01" />
              </svg>
              <div>
                <strong>Status follows assignment</strong>
                <p>Occupancy isn’t edited on the room. Assign a tenant to mark it occupied; end the assignment to make it available.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

    </div>
  );
}
