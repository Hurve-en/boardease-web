import { signOut } from "@/app/login/actions";
import { Bell } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";

type DashboardShellProps = {
  section: string;
  children: React.ReactNode;
};

const todayLabel = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Manila",
}).format(new Date());

export default function DashboardShell({
  section,
  children,
}: DashboardShellProps) {
  return (
    <main className="dashboard-shell dashboard-shell-with-sidebar">
      <DashboardSidebar />
      <div className="dashboard-main">
        <header className="topbar">
          <div className="breadcrumb">
            <span>OWNER / WEB</span>
            <span className="crumb-divider">/</span>
            <strong>{section}</strong>
          </div>
          <div className="topbar-actions">
            <span>{todayLabel}</span>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <form action={signOut}>
              <button className="signout-button" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </header>
        {children}
        <footer className="dashboard-footer">
          <span>
            BoardEase · Maple House · All amounts in Philippine pesos (PHP)
          </span>
          <span>Owner workspace</span>
        </footer>
      </div>
    </main>
  );
}
