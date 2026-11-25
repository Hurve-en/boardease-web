import { signOut } from "@/app/login/actions";
import { verifyAdmin } from "@/lib/dal";
import { LogOut } from "lucide-react";
import { cookies } from "next/headers";
import DashboardSidebar from "./DashboardSidebar";
import ZoomToggle from "./ZoomToggle";
import { ZOOM_COOKIE } from "./zoom";

type DashboardShellProps = {
  section: string;
  children: React.ReactNode;
};

const SECTION_LABEL: Record<string, string> = {
  DASHBOARD: "Dashboard",
  ROOMS: "Rooms",
  TENANTS: "Tenants",
  MONTHLY: "Monthly bills",
  PAYMENTS: "Payments",
  BILL_HISTORY: "Bill history",
};

function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const words = local.split(/[._-]+/).filter(Boolean);
  if (words.length === 0) return "Owner";
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default async function DashboardShell({ section, children }: DashboardShellProps) {
  const admin = await verifyAdmin();
  const name = displayNameFromEmail(admin.email);
  const zoomed = (await cookies()).get(ZOOM_COOKIE)?.value === "1";

  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date());

  return (
    <div className={zoomed ? "app-shell is-zoomed" : "app-shell"}>
      <DashboardSidebar />
      <div className="app-main">
        <header className="app-topbar">
          <p className="app-topbar-date">{today}</p>
          <div className="app-account">
            <span className="app-account-avatar" aria-hidden="true">
              {initialsOf(name)}
            </span>
            <span className="app-account-text" title={admin.email}>
              <strong>{name}</strong>
              <span>Owner</span>
            </span>
            <span className="app-topbar-divider" aria-hidden="true" />
            <ZoomToggle initialZoomed={zoomed} />
            <form action={signOut}>
              <button className="app-signout" type="submit">
                <LogOut size={14} aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </header>
        <main className="app-content" aria-label={SECTION_LABEL[section] ?? "Owner workspace"}>
          {children}
        </main>
      </div>
    </div>
  );
}
