import { verifyAdmin } from "@/lib/dal";
import { signOut } from "@/app/login/actions";
import DashboardNavbar from "@/app/components/dashboard/navbar";
import { Bell } from "lucide-react";
import RoomsClient from "./rooms-client";

export default async function RoomsPage() {
  await verifyAdmin();
  const todayLabel = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date());

  return (
    <main className="dashboard-shell" style={{ flexDirection: "row" }}>
      <DashboardNavbar />
      <div className="dashboard-main">
        <header className="topbar">
          <div className="breadcrumb"><span>OWNER / WEB</span><span className="crumb-divider">/</span><strong>ROOMS</strong></div>
          <div className="topbar-actions"><span>{todayLabel}</span><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><form action={signOut}><button className="signout-button" type="submit">Sign out</button></form></div>
        </header>
        <RoomsClient />
        <footer className="dashboard-footer"><span>BoardEase · Maple House · All amounts in Philippine pesos (PHP)</span><span>Owner workspace</span></footer>
      </div>
    </main>
  );
}
