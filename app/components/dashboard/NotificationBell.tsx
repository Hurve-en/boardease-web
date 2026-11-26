"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./NotificationBell.module.css";

type Notice = { id: number; title: string; body: string; billId: string; billingMonth: string; eventKey: string; readAt: string | null };
type Page = { items: Notice[]; unread: number; next: number | null };

async function loadPage(signal?: AbortSignal, before?: number): Promise<Page> {
  const response = await fetch("/api/notifications" + (before ? `?before=${before}` : ""), { signal });
  if (!response.ok) throw new Error("Couldn’t load notifications.");
  return response.json();
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, retry] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const data = await loadPage(controller.signal);
        if (!controller.signal.aborted) { setPage(data); setError(""); }
      } catch {
        if (!controller.signal.aborted) setError("Couldn’t load notifications.");
      }
    }
    void refresh();
    const timer = open ? undefined : window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [open, attempt]);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (!panel.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  async function select(item: Notice) {
    setBusy(true);
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) });
      if (!response.ok) throw new Error();
      setOpen(false);
      router.push(`/payments/${item.billId}?month=${item.billingMonth.slice(0, 7)}&proof=${item.eventKey}#proof-${item.eventKey}`);
    } catch { setError("Couldn’t open the notification. Please try again."); }
    finally { setBusy(false); }
  }

  async function more() {
    if (!page?.next) return;
    setBusy(true);
    try {
      const next = await loadPage(undefined, page.next);
      setPage({ ...next, items: [...page.items, ...next.items] });
    } catch { setError("Couldn’t load older notifications."); }
    finally { setBusy(false); }
  }

  return <div ref={panel} className={styles.container} onKeyDown={event => {
    if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); }
  }}>
    <button type="button" className={styles.toggle} ref={toggle} aria-label={`Notifications, ${page?.unread ?? 0} unread`} aria-expanded={open} onClick={() => setOpen(!open)}>
      <Bell size={19} />{Boolean(page?.unread) && <span>{page?.unread}</span>}
    </button>
    {open && <section aria-label="Notifications" className={styles.panel}>
      <h2>Notifications</h2>
      {error && <p role="alert">{error} <button onClick={() => retry(attempt + 1)}>Retry</button></p>}
      {!page && !error && <p>Loading…</p>}
      {page?.items.length === 0 && <p>No notifications yet.</p>}
      {page?.items.map(item => <button className={styles.item} disabled={busy} key={item.id} onClick={() => select(item)}>
        <strong>{!item.readAt && "● "}{item.title}</strong><span>{item.body}</span>
      </button>)}
      {page?.next && <button disabled={busy} onClick={more}>Load older notifications</button>}
    </section>}
  </div>;
}
