import { Manrope, Sora } from "next/font/google";
import { ReactNode, CSSProperties, useState } from "react";

import { AdminNavbar } from "@/components/admin/navbar";
import { AdminSidebar } from "@/components/admin/sidebar";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(256);

  return (
    <div
      className={`${sora.variable} ${manrope.variable} relative flex min-h-screen bg-background`}
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
          fontFamily: "var(--font-body)",
        } as CSSProperties
      }
    >
      <AdminSidebar
        className="hidden md:flex"
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
      />

      <main className="relative min-h-screen flex-1 transition-all duration-200 md:ml-(--sidebar-width)">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(96,165,250,0.42),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(251,146,60,0.34),transparent_26%),radial-gradient(circle_at_50%_88%,rgba(129,140,248,0.16),transparent_28%),linear-gradient(120deg,rgba(242,247,255,0.98)_0%,rgba(255,240,232,0.92)_52%,rgba(239,246,255,0.98)_100%)]" />
        <AdminNavbar />
        <div className="relative z-10 p-4 md:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
