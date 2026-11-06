"use client";

import {
  Building2,
  CreditCard,
  DoorOpen,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Rooms", icon: DoorOpen, href: "/rooms" },
  { label: "Tenants", icon: UsersRound, href: "/tenants" },
  { label: "Monthly bills", icon: ReceiptText, href: "/monthly-bills" },
  { label: "Payments", icon: CreditCard, href: "/payments" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar" aria-label="Main navigation">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">
          <Building2 size={13} strokeWidth={2.4} />
        </span>
        BoardEase
      </div>

      <button type="button" className="workspace-switcher">
        <span>Maple House</span>
        <span>Owner workspace⌄</span>
      </button>

      <nav aria-label="Workspace" className="sidebar-navigation">
        {navigation.map(({ label, icon: Icon, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`sidebar-link${active ? " is-active" : ""}`}
            >
              <Icon size={14} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-note">
        <ShieldCheck size={15} />
        <p>A clear record for every room and every payment.</p>
      </div>

      <div className="sidebar-account">
        <span className="sidebar-avatar">ED</span>
        <span>
          <span>Elena Dela Cruz</span>
          <small>Owner / Admin</small>
        </span>
      </div>
    </aside>
  );
}
