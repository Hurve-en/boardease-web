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
import {usePathname} from "next/navigation";

const navigation = [
	{ label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
	{ label: "Rooms", icon: DoorOpen, href: "/rooms" },
	{ label: "Tenants", icon: UsersRound, href: "/tenants" },
	{ label: "Monthly bills", icon: ReceiptText, active: true, href: "/monthly-bills" },
	{ label: "Payments", icon: CreditCard, href: "/payments" },
];

export default function DashboardNavbar() {

    const pathname = usePathname();

	return (
		<aside
			aria-label="Main navigation"
			style={{
				width: 224,
				minHeight: "100vh",
				padding: "18px 12px 14px",
				background: "#38271f",
				color: "#f7f0e9",
				display: "flex",
				flexDirection: "column",
				fontFamily: "Arial, Helvetica, sans-serif",
				boxSizing: "border-box",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
				<span style={{ width: 19, height: 19, borderRadius: 6, display: "grid", placeItems: "center", background: "#dfd2c4", color: "#38271f" }}>
					<Building2 size={13} strokeWidth={2.4} />
				</span>
				BoardEase
			</div>

			<button
				type="button"
				style={{
					width: "100%",
					padding: "10px 9px",
					border: 0,
					borderRadius: 8,
					background: "#63432f",
					color: "#fff7ef",
					textAlign: "left",
					cursor: "pointer",
					marginBottom: 15,
				}}
			>
				<span style={{ display: "block", fontSize: 11, fontWeight: 600 }}>Maple House</span>
				<span style={{ display: "block", marginTop: 4, fontSize: 9, color: "#cfbba9" }}>Owner workspace⌄</span>
			</button>

			<nav aria-label="Workspace" style={{ display: "grid", gap: 4 }}>
                {navigation.map(({ label, icon: Icon, href }) => {
                    const active = pathname === href;

                    return (
                    <Link
                        key={label}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        style={{
                        minHeight: 36,
                        padding: "0 9px",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        background: active ? "#eee2d5" : "transparent",
                        color: active ? "#39291f" : "#d4c7bc",
                        fontSize: 11,
                        fontWeight: active ? 600 : 400,
                        textDecoration: "none",
                        transition: "background-color 180ms ease, color 180ms ease",
                        }}
                    >
                        <Icon size={14} strokeWidth={1.8} />
                        {label}
                    </Link>
                    );
                })}
                </nav>

                

			<div style={{ marginTop: 19, padding: "11px 10px", border: "1px solid #624a3d", borderRadius: 8, color: "#ddcec2" }}>
				<ShieldCheck size={15} style={{ display: "block", marginBottom: 7 }} />
				<p style={{ margin: 0, fontSize: 10, lineHeight: 1.5 }}>A clear record for every room and every payment.</p>
			</div>

			<div style={{ marginTop: "auto", padding: "16px 1px 0", display: "flex", alignItems: "center", gap: 8 }}>
				<span style={{ width: 27, height: 27, borderRadius: "50%", background: "#805a43", color: "#fff", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700 }}>ED</span>
				<span style={{ minWidth: 0 }}>
					<span style={{ display: "block", fontSize: 10, fontWeight: 600 }}>Elena Dela Cruz</span>
					<span style={{ display: "block", marginTop: 3, color: "#c6b4a6", fontSize: 9 }}>Owner / Admin</span>
				</span>
			</div>
		</aside>
	);
}
