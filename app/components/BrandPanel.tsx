import { ChartColumn, ChartPie, Clock3, FileCheck2, HandCoins, House, ReceiptText, Wallet } from "lucide-react";
import Image from "next/image";
import styles from "./BrandPanel.module.css";

const charges = [
  { rent: 62, electric: 30, water: 12 },
  { rent: 58, electric: 18, water: 8 },
  { rent: 36, electric: 4, water: 3 },
  { rent: 62, electric: 30, water: 12 },
  { rent: 40, electric: 9, water: 5 },
];

const balances = [
  { initials: "MS", name: "Maya Santos", amount: "₱6,200.00", status: "unpaid", label: "Unpaid" },
  { initials: "LR", name: "Liam Reyes", amount: "₱2,350.00", status: "partial", label: "Partial" },
  { initials: "AC", name: "Ana Cruz", amount: "₱0.00", status: "paid", label: "Paid" },
] as const;

export default function BrandPanel() {
  return (
    <aside className={styles.panel} aria-hidden="true">
      <div className={styles.logo}>
        <Image src="/boardease-mark.png" alt="" width={493} height={469} className={styles.logoMark} style={{ width: 32, height: "auto" }} priority />
        BoardEase
      </div>
      <div className={styles.fade} />

      <div className={styles.stage}>
        <div className={styles.plane}>
          <div className={styles.column}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.iconChip}>
                  <Wallet size={14} />
                </span>
                Collected
              </div>
              <p className={styles.figure}>
                <small>₱</small>34,396.00
              </p>
              <div className={styles.meta}>
                <span className={styles.pill}>35.8%</span>
                from 9 payments this month
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.iconChip}>
                  <ChartColumn size={14} />
                </span>
                Billing overview
              </div>
              <p className={styles.figure}>
                <small>₱</small>96,196.50
              </p>
              <div className={styles.bars}>
                {charges.map((bar, index) => (
                  <div key={index} className={styles.stack}>
                    <span className={styles.water} style={{ height: bar.water }} />
                    <span className={styles.electric} style={{ height: bar.electric }} />
                    <span className={styles.rent} style={{ height: bar.rent }} />
                  </div>
                ))}
              </div>
              <div className={styles.legend}>
                <span>
                  <i className={styles.rent} />
                  Rent
                </span>
                <span>
                  <i className={styles.electric} />
                  Electricity
                </span>
                <span>
                  <i className={styles.water} />
                  Water
                </span>
              </div>
            </div>

            <div className={styles.card}>
              <span className={`${styles.tile} ${styles.tileA}`}>
                <span className={styles.tilePeso}>₱</span>
              </span>
              <div className={styles.cardTitle}>
                <span className={styles.iconChip}>
                  <ReceiptText size={14} />
                </span>
                Balances
              </div>
              <div className={styles.rows}>
                {balances.map((row) => (
                  <div key={row.name} className={styles.row}>
                    <span className={styles.avatar}>{row.initials}</span>
                    <span className={styles.rowName}>{row.name}</span>
                    <span className={styles.rowAmount}>{row.amount}</span>
                    <span className={`${styles.badge} ${styles[row.status]}`}>{row.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`${styles.column} ${styles.columnOffset}`}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.iconChip}>
                  <HandCoins size={14} />
                </span>
                Recent payments
              </div>
              <p className={styles.figure}>
                <small>₱</small>3,000.00
              </p>
              <div className={styles.meta}>
                <span className={styles.pill}>Latest</span>
                from Maya Santos
              </div>
              <div className={styles.payBars}>
                <span style={{ height: "38%" }} />
                <span style={{ height: "92%" }} />
                <span style={{ height: "64%" }} />
                <span style={{ height: "78%" }} />
                <span className={styles.payLatest} style={{ height: "52%" }} />
              </div>
              <span className={`${styles.tile} ${styles.tileB}`}>
                <Image src="/boardease-mark.png" alt="" width={493} height={469} className={styles.tileMark} style={{ width: 72, height: "auto" }} loading="eager" />
              </span>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.iconChip}>
                  <ChartPie size={14} />
                </span>
                Bill status
              </div>
              <svg className={styles.gauge} viewBox="0 0 220 116">
                <path d="M 26 110 A 84 84 0 0 1 194 110" fill="none" stroke="var(--be-surface-muted)" strokeWidth="30" />
                <path d="M 26 110 A 84 84 0 0 1 194 110" fill="none" stroke="var(--be-success-text)" strokeWidth="30" pathLength={100} strokeDasharray="34 100" />
                <path d="M 26 110 A 84 84 0 0 1 194 110" fill="none" stroke="var(--be-warning-text)" strokeWidth="30" pathLength={100} strokeDasharray="15 100" strokeDashoffset={-35} />
                <path d="M 26 110 A 84 84 0 0 1 194 110" fill="none" stroke="var(--be-danger-text)" strokeWidth="30" pathLength={100} strokeDasharray="49 100" strokeDashoffset={-51} />
              </svg>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.iconChip}>
                  <House size={14} />
                </span>
                Room occupancy
              </div>
              <p className={styles.figure}>
                13<small> / 13 rooms</small>
              </p>
              <div className={styles.meta}>
                <span className={`${styles.pill} ${styles.pillNeutral}`}>100%</span>
                every room is taken
              </div>
              <span className={`${styles.tile} ${styles.tileC}`}>
                <ReceiptText size={46} strokeWidth={1.9} />
              </span>
            </div>
          </div>

          <div className={`${styles.column} ${styles.columnRaised}`}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.iconChip}>
                  <Clock3 size={14} />
                </span>
                Outstanding
              </div>
              <p className={styles.figure}>
                <small>₱</small>61,800.00
              </p>
              <div className={styles.meta}>
                <span className={`${styles.pill} ${styles.pillDanger}`}>8 open</span>
                due 10 November
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.iconChip}>
                  <FileCheck2 size={14} />
                </span>
                Proofs to review
              </div>
              <p className={styles.figure}>10</p>
              <div className={styles.meta}>
                <span className={`${styles.pill} ${styles.pillWarning}`}>₱8,700.00</span>
                waiting for approval
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.iconChip}>
                  <ChartColumn size={14} />
                </span>
                Billing overview
              </div>
              <p className={styles.figure}>
                <small>₱</small>22,250.00
              </p>
              <div className={styles.bars}>
                {charges.slice().reverse().map((bar, index) => (
                  <div key={index} className={styles.stack}>
                    <span className={styles.water} style={{ height: bar.water }} />
                    <span className={styles.electric} style={{ height: bar.electric }} />
                    <span className={styles.rent} style={{ height: bar.rent }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
