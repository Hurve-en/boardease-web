import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import s from "./design-system.module.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"]});

export const metadata: Metadata = {
    title: "Design System - Boardease",
    robots: {index: false, follow: false},
};

const SECTIONS = ["foundations", "components", "conventions"];

const COLORS = [
    { name: "Background / Canvas", hex: "#F7F4EE", v: "--be-canvas" },
    { name: "Surface / Default", hex: "#FFFFFF", v: "--be-surface" },
    { name: "Surface / Subtle", hex: "#EEE7DD", v: "--be-surface-subtle" },
    { name: "Surface / Selected", hex: "#EDE1D3", v: "--be-surface-selected" },
    { name: "Navigation / Sidebar", hex: "#38271F", v: "--be-nav-sidebar" },
    { name: "Action / Primary", hex: "#603E2B", v: "--be-action-primary" },
    { name: "Text / Primary", hex: "#302A25", v: "--be-text-primary" },
    { name: "Text / Muted", hex: "#80766D", v: "--be-text-muted" },
    { name: "Border / Subtle", hex: "#E5DED5", v: "--be-border-subtle" },
    { name: "Border / Strong", hex: "#D5C3B3", v: "--be-border-strong" },
];

const STATUS = [
    { name: "Success / Paid", note: "Settled bill · no balance", text: "#38674B", bg: "#E8F0E9", t: "--be-success-text", b: "--be-success-surface" },
    { name: "Warning / Partial", note: "Some payment recorded", text: "#8D6127", bg: "#FAEED7", t: "--be-warning-text", b: "--be-warning-surface" },
    { name: "Danger / Unpaid", note: "No payment recorded", text: "#9B493B", bg: "#F7E6E0", t: "--be-danger-text", b: "--be-danger-surface" },
];

const TYPE = [
    { px: 46, wt: 600, role: "Welcome display", use: "Auth introduction · 1.15" },
    { px: 32, wt: 600, role: "Welcome title", use: "Desktop sign-up · 1.20" },
    { px: 30, wt: 600, role: "Page / metric", use: "Desktop heading · 1.20" },
    { px: 26, wt: 700, role: "Balance", use: "Outstanding amount · 1.20" },
    { px: 23, wt: 600, role: "Mobile title", use: "Billing month · 1.45" },
    { px: 17, wt: 600, role: "Section heading", use: "Card heading · 1.45" },
    { px: 16, wt: 400, role: "Lead body", use: "Welcome copy · 1.45" },
    { px: 14, wt: 400, role: "Body / input", use: "Descriptions, values · 1.45" },
    { px: 13, wt: 600, role: "Label / action", use: "Forms, buttons · 1.45" },
    { px: 12, wt: 400, role: "Supporting", use: "Secondary copy · 1.45" },
    { px: 11, wt: 700, role: "Caption / status", use: "Metadata, badges · 1.45" },
];

const SPACING = [4, 8, 12, 16, 20, 24, 32, 40];

const RADIUS = [
    { px: 8, label: "Controls" },
    { px: 10, label: "Insets" },
    { px: 12, label: "Tables" },
    { px: 16, label: "Cards" },
    { px: 999, label: "Pill" },
];

const BUTTON_STATES = ["", "hover", "focus", "disabled"] as const;

const BUTTONS = [
    { variant: "primary", label: "Record payment", use: "One main task per section." },
    { variant: "secondary", label: "View bill", use: "Supporting actions and filters." },
    { variant: "tertiary", label: "Cancel", use: "Low-emphasis navigation or cancel." },
] as const;

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound(); // dev only

    return (
        <div className={`${s.page} ${inter.className}`}>
        <div className={s.wrap}>
            <p className={s.meta}>Internal · dev only</p>
            <h1 className={s.h1}>BoardEase design system</h1>
            <p className={s.lead}>
            A warm, practical system for residential finances. These foundations document the
            existing BoardEase screens, not a new brand direction.
            </p>

            <nav className={s.nav} aria-label="Design system sections">
            {SECTIONS.map((id) => (
                <a key={id} href={`#${id}`} style={{ textTransform: "capitalize" }}>{id}</a>
            ))}
            </nav>

            {/* ---------- FOUNDATIONS ---------- */}
            <section id="foundations" className={s.section}>
            <h2 className={s.h2}>Foundations</h2>
            <p className={s.sub}>Declared once in globals.css as --be-* variables. Use the variable, never the hex.</p>

            <h3 className={s.h2}>Semantic color</h3>
            <div className={`${s.grid} ${s.g5}`}>
                {COLORS.map((c) => (
                <div key={c.v}>
                    <div className={s.swatch} style={{ background: `var(${c.v})` }} />
                    <div className={s.swName}>{c.name}</div>
                    <div className={s.swHex}>{c.hex}</div>
                    <div className={s.swHex}>{c.v}</div>
                </div>
                ))}
            </div>

            <div className={`${s.grid} ${s.g3}`} style={{ marginTop: 16 }}>
                {STATUS.map((c) => (
                <div key={c.name} className={s.status} style={{ background: `var(${c.b})`, color: `var(${c.t})` }}>
                    <strong>{c.name}</strong>
                    <div>Text {c.text} / Surface {c.bg}</div>
                    <div>{c.note}</div>
                </div>
                ))}
            </div>

            <h3 className={s.h2} style={{ marginTop: 32 }}>Typography · Inter</h3>
            <div className={s.card}>
                {TYPE.map((t) => (
                <div key={t.role} className={s.typeRow}>
                    <span className={s.helper}>{t.px} / {t.wt}</span>
                    <span style={{ fontSize: Math.min(t.px, 23), fontWeight: t.wt }}>{t.role}</span>
                    <span className={s.helper}>{t.use}</span>
                </div>
                ))}
                <p className={s.note}>
                Previews above 23 px are reduced to fit. Currency: ₱ before the amount, comma grouping,
                two decimals (₱2,350.00).
                </p>
            </div>

            <div className={`${s.grid} ${s.g2}`} style={{ marginTop: 16 }}>
                <div className={s.card}>
                <h3 className={s.h2}>Spacing scale</h3>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
                    {SPACING.map((n) => (
                    <div key={n} style={{ textAlign: "center" }}>
                        <div className={s.spacer} style={{ width: n, height: 40, margin: "0 auto" }} />
                        <div className={s.helper}>{n}</div>
                    </div>
                    ))}
                </div>
                <p className={s.note}>4–8 inline · 12–16 related · 20–24 card inset · 32–40 sections.</p>
                </div>
                <div className={s.card}>
                <h3 className={s.h2}>Radius scale</h3>
                <div style={{ display: "flex", gap: 12 }}>
                    {RADIUS.map((r) => (
                    <div key={r.label} style={{ textAlign: "center" }}>
                        <div className={s.radiusBox} style={{ borderRadius: r.px, width: r.px === 999 ? 72 : 56 }} />
                        <div className={s.helper}>{r.px === 999 ? "Pill" : `${r.px} px`}</div>
                        <div className={s.helper}>{r.label}</div>
                    </div>
                    ))}
                </div>
                <p className={s.note}>1 px borders throughout. Flat by default; --be-shadow-raised is for menus only.</p>
                </div>
            </div>
            </section>

            {/* ---------- COMPONENTS ---------- */}
            <section id="components" className={s.section}>
            <h2 className={s.h2}>Components</h2>
            <p className={s.sub}>State samples are forced with classes so they show side by side. Real controls use :hover, :focus-visible and :disabled.</p>

            <h3 className={s.h2}>Actions &amp; interaction states</h3>
            <div className={s.card}>
                <div className={`${s.grid} ${s.g4}`} style={{ marginBottom: 12 }}>
                {["Default", "Hover", "Focus", "Disabled"].map((h) => (
                    <span key={h} className={s.stateHead}>{h.toUpperCase()}</span>
                ))}
                </div>
                {BUTTONS.map((b) => (
                <div key={b.variant} style={{ marginBottom: 16 }}>
                    <div className={s.helper} style={{ marginBottom: 8 }}>
                    <strong style={{ color: "var(--be-text-primary)" }}>{b.variant}</strong> · {b.use}
                    </div>
                    <div className={`${s.grid} ${s.g4}`}>
                    {BUTTON_STATES.map((st) => (
                        <div key={st}>
                        <button
                            type="button"
                            className={`${s.btn} ${s[b.variant]} ${st ? s[st] : ""}`}
                            disabled={st === "disabled"}
                        >
                            {b.label}
                        </button>
                        </div>
                    ))}
                    </div>
                </div>
                ))}
                <p className={s.note}>44 px height · 18 px inset · 13 px / 600 · 8 px radius. Focus: 2 px primary ring, 3 px gap.</p>
            </div>

            <h3 className={s.h2} style={{ marginTop: 32 }}>Labeled text fields</h3>
            <div className={s.card}>
                <div className={`${s.grid} ${s.g4}`}>
                {[
                    { state: "Default", cls: "", help: "Use the email linked to your tenancy.", value: "maya.santos@email.com" },
                    { state: "Focused", cls: s.focus, help: "Use the email linked to your tenancy.", value: "maya.santos@email.com" },
                    { state: "Error", cls: s.error, help: "Enter a valid email address.", value: "maya.santos@", err: true },
                    { state: "Disabled", cls: "", help: "Contact your owner to update this.", value: "maya.santos@email.com", dis: true },
                ].map((f) => (
                    <div key={f.state} className={s.field}>
                    <span className={s.stateHead}>{f.state.toUpperCase()}</span>
                    <label className={s.label} htmlFor={`email-${f.state}`}>Email address</label>
                    <input
                        id={`email-${f.state}`}
                        className={`${s.input} ${f.cls}`}
                        defaultValue={f.value}
                        disabled={f.dis}
                        aria-invalid={f.err || undefined}
                    />
                    <span className={`${s.helper} ${f.err ? s.helperError : ""}`}>{f.help}</span>
                    </div>
                ))}
                </div>
                <p className={s.note}>46 px inputs · 14 px text · 14 px inset. Never use placeholder text as a label.</p>
            </div>

            <div className={`${s.grid} ${s.g2}`} style={{ marginTop: 32 }}>
                <div>
                <h3 className={s.h2}>Billing status</h3>
                <div className={s.card}>
                    <div style={{ display: "flex", gap: 12 }}>
                    <span className={`${s.badge} ${s.paid}`}>Paid</span>
                    <span className={`${s.badge} ${s.partial}`}>Partial</span>
                    <span className={`${s.badge} ${s.unpaid}`}>Unpaid</span>
                    </div>
                    <p className={s.note}>Always keep the word; never rely on the tint alone. Inform, don&apos;t imply an action.</p>
                </div>
                </div>

                <div>
                <h3 className={s.h2}>Owner navigation</h3>
                <div className={s.sidebar}>
                    <div className={s.navItem}>Rooms</div>
                    <div className={`${s.navItem} ${s.navItemActive}`}>Rooms</div>
                </div>
                <p className={s.note}>46 px items inside the 232 px desktop sidebar.</p>
                </div>
            </div>

            <div className={`${s.grid} ${s.g2}`} style={{ marginTop: 32 }}>
                <div>
                <h3 className={s.h2}>Checkbox</h3>
                <div className={s.card}>
                    <div style={{ display: "flex", gap: 24 }}>
                    <label className={s.checkRow}>
                        <span className={s.checkBox} />
                        Remember me
                    </label>
                    <label className={s.checkRow}>
                        <span className={`${s.checkBox} ${s.checkBoxOn}`} aria-hidden>✓</span>
                        Remember me
                    </label>
                    </div>
                    <p className={s.note}>18 px box · 4 px radius · 10 px gap, inside a 44 px labeled hit area.</p>
                </div>
                </div>

                <div>
                <h3 className={s.h2}>Tabs</h3>
                <div className={s.card}>
                    <div className={s.tabs} role="tablist">
                    <button className={s.tab} role="tab" aria-selected="false">Outstanding</button>
                    <button className={`${s.tab} ${s.tabActive}`} role="tab" aria-selected="true">All bills</button>
                    <button className={`${s.tab} ${s.tabDisabled}`} role="tab" disabled>Archived</button>
                    </div>
                    <p className={s.note}>Active: 2 px primary underline + selected fill. Default: 1 px divider.</p>
                </div>
                </div>
            </div>
            </section>

            {/* ---------- CONVENTIONS ---------- */}
            <section id="conventions" className={s.section}>
            <h2 className={s.h2}>Conventions</h2>
            <div className={s.card}>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
                <li>Keep one primary action per task.</li>
                <li>Favor 1 px borders over shadows; hierarchy comes from spacing.</li>
                <li>Never rely on color alone: show Paid, Partial or Unpaid as text.</li>
                <li>Muted text (#80766D) is 4.44:1 on white and misses AA for normal text. Use primary text for essential small copy in new UI.</li>
                <li>Preserve 44 px minimum touch targets.</li>
                <li>Use the --be-* variables; a hex in a component is a bug in the token layer.</li>
                </ul>
            </div>
            </section>
        </div>
        </div>
    );
}