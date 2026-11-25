"use client";

import {
  CreditCard,
  DoorOpen,
  LayoutDashboard,
  ReceiptText,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { label: string; icon: LucideIcon; href: string; matches?: string[] };

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }],
  },
  {
    label: "Manage",
    items: [
      { label: "Rooms", icon: DoorOpen, href: "/rooms", matches: ["/room_management"] },
      { label: "Tenants", icon: UsersRound, href: "/tenants" },
    ],
  },
  {
    label: "Billing",
    items: [
      { label: "Monthly bills", icon: ReceiptText, href: "/monthly-bills" },
      { label: "Payments", icon: CreditCard, href: "/payments" },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  return item.matches?.some((prefix) => pathname.startsWith(prefix)) ?? false;
}

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar" aria-label="Main navigation">
      <Link href="/dashboard" className="app-brand">
        <Image src="/boardease-mark.png" alt="" width={493} height={469} className="app-brand-mark" style={{ width: 26, height: "auto" }} priority />
        BoardEase
      </Link>

      <nav className="app-nav" aria-label="Workspace">
        {groups.map((group) => (
          <div key={group.label} className="app-nav-group">
            <p className="app-nav-label">{group.label}</p>
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`app-nav-link${active ? " is-active" : ""}`}
                >
                  <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="app-sidebar-foot">
      <div className="app-house">
        <span className="app-house-mark" aria-hidden="true">
          MH
        </span>
        <span>
          <strong>Maple House</strong>
          <span>Boarding house</span>
        </span>
      </div>
      <p className="app-copyright">© {new Date().getFullYear()} BoardEase</p>
      </div>
    </aside>
  );
}
