import { Manrope, Sora } from "next/font/google";
import { AdminSidebar } from "./AdminSidebar";
import { AdminNavbar } from "./AdminNavbar";
import { ReactNode } from "react";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div
      className={`${sora.variable} ${manrope.variable} flex min-h-screen bg-background`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <AdminSidebar />
      <div className="relative min-h-screen flex-1">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(96,165,250,0.42),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(251,146,60,0.34),transparent_26%),radial-gradient(circle_at_50%_88%,rgba(129,140,248,0.16),transparent_28%),linear-gradient(120deg,rgba(242,247,255,0.98)_0%,rgba(255,240,232,0.92)_52%,rgba(239,246,255,0.98)_100%)]" />
        <AdminNavbar />
        <div className="relative z-10 p-6">{children}</div>
      </div>
    </div>
  );
}