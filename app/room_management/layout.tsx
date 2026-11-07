import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import DashboardSidebar from "@/app/components/dashboard/DashboardSidebar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0 }}>
        <main className="dashboard-shell dashboard-shell-with-sidebar">
          <DashboardSidebar />
          <div className="dashboard-main">{children}</div>
        </main>
      </body>
    </html>
  );
}
