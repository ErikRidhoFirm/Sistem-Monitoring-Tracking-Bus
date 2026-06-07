import { Manrope, Sora } from "next/font/google";
import { ReactNode, CSSProperties, useEffect, useState } from "react";

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

const SIDEBAR_WIDTH_STORAGE_KEY = "admin-sidebar-width";

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") {
      return 256;
    }

    const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);

    if (!storedWidth) {
      return 256;
    }

    const parsedWidth = Number(storedWidth);

    return Number.isFinite(parsedWidth) && parsedWidth > 0 ? parsedWidth : 256;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (!isMobileSidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  return (
    <div
      className={`${sora.variable} ${manrope.variable} relative flex min-h-screen bg-background overflow-x-hidden`}
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
          fontFamily: "var(--font-body)",
        } as CSSProperties
      }
    >
      <style>{`
        @media (min-width: 768px) {
          main[data-admin-shell] {
            margin-left: var(--sidebar-width) !important;
          }
          [data-admin-navbar] {
            left: var(--sidebar-width) !important;
          }
        }
      `}</style>
      <AdminSidebar
        className=""
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {isMobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Tutup sidebar"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] md:hidden"
        />
      ) : null}

      <main
        data-admin-shell
        className="relative min-h-screen flex-1 transition-all duration-200 overflow-x-hidden"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(96,165,250,0.42),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(251,146,60,0.34),transparent_26%),radial-gradient(circle_at_50%_88%,rgba(129,140,248,0.16),transparent_28%),linear-gradient(120deg,rgba(242,247,255,0.98)_0%,rgba(255,240,232,0.92)_52%,rgba(239,246,255,0.98)_100%)]" />
        <AdminNavbar
          onMobileMenuClick={() => setIsMobileSidebarOpen((current) => !current)}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />
        <div className="relative z-10 p-4 pt-20 md:p-8 md:pt-24">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
