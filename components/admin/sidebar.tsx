"use client";

import {
  BusFront,
  Cpu,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPinned,
  ReceiptText,
  Route,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
// Ikon yang kita gunakan untuk Sidebar dan Profile
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";

/** * Fungsi helper 'cn' (biasanya ada di folder lib/utils.ts)
 * Jika kamu belum punya, kamu bisa buat sendiri seperti ini:
 */

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const defaultItems: SidebarItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Buses", href: "/admin/buses", icon: BusFront },
  { label: "IoT Devices", href: "/admin/iot-devices", icon: Cpu },
  { label: "Routes", href: "/admin/routes", icon: Route },
  { label: "Stations", href: "/admin/stations", icon: MapPinned },
  { label: "Cards", href: "/admin/cards", icon: CreditCard },
  { label: "Transactions", href: "/admin/transactions", icon: ReceiptText },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

type AdminSidebarProps = {
  className?: string;
  items?: SidebarItem[];
  width?: number;
  onWidthChange?: (width: number) => void;
};

export function AdminSidebar({
  className,
  items = defaultItems,
  width = 256,
  onWidthChange,
}: AdminSidebarProps) {
  const router = useRouter();
  const isCollapsed = width <= 96;

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error(error.message ?? "Gagal logout");
      return;
    }

    toast.success("Berhasil logout");
    await router.push("/auth/login");
  };


  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden border-r border-white/15 bg-[linear-gradient(135deg,#17355a_0%,#214d79_52%,#5b8de3_100%)] text-sidebar-foreground shadow-[12px_0_40px_rgba(15,23,42,0.18)] transition-all duration-200 ease-in-out",
        className,
      )}
      style={{ width: `${width}px` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04)_0%,transparent_18%,rgba(0,0,0,0.08)_100%)]" />
      {/* resize handle removed per request */}
      <div className="relative z-10 mb-6 px-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          {/* TITLE (TIDAK HILANG, CUMA FADE) */}
          <div
            className={cn(
              "transition-all duration-300 origin-left",
              isCollapsed
                ? "scale-0 opacity-0 w-0"
                : "scale-100 opacity-100 w-auto",
            )}
          >
            <div className="flex items-center gap-3 min-w-max">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff9a4d_0%,#ff7a2f_100%)] text-sm font-bold tracking-wide text-white shadow-lg shadow-orange-500/25">
                BW
              </span>
              <div>
                <h1
                  className="text-lg font-semibold tracking-tight text-white leading-none"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Buswy
                </h1>
                <p className="mt-1 text-xs text-[#f4f1e8]/70">Campus Transit</p>
              </div>
            </div>
          </div>

          {/* TOGGLE */}
          <button
            onClick={() => onWidthChange?.(isCollapsed ? 256 : 96)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:bg-white/10"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-slate-200" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-slate-200" />
            )}
          </button>
        </div>
      </div>

      {/* ================= NAV ================= */}
      <nav className="relative z-10 flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const active =
            router.pathname === item.href ||
            (item.href !== "/admin" && router.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-[linear-gradient(135deg,rgba(255,154,77,0.95)_0%,rgba(255,122,47,0.85)_100%)] text-[#f4f1e8] shadow-[0_12px_28px_rgba(255,122,47,0.22)]"
                  : "text-[#f4f1e8]/72 hover:bg-white/8 hover:text-[#f4f1e8]",
              )}
            >
              {/* ICON (FIX SIZE) */}
              <span className="flex w-5 shrink-0 items-center justify-center">
                <item.icon className="h-5 w-5" />
              </span>

              {/* TEXT */}
              <span
                className={cn(
                  "ml-3 inline-block overflow-hidden whitespace-nowrap transition-all duration-200 origin-left",
                  isCollapsed
                    ? "max-w-0 scale-0 opacity-0 ml-0"
                    : "max-w-[180px] scale-100 opacity-100 ml-3",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ================= FOOTER ================= */}
      <div className="relative z-10 mb-3 flex w-full items-center px-4 py-2">
        {/* Container Avatar dengan lebar tetap agar tidak geser */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(255,154,77,0.95)_0%,rgba(255,122,47,0.85)_100%)] text-white transition-transform duration-300 shadow-lg shadow-orange-500/20">
            <span className="text-sm font-semibold">AU</span>
          </div>
        </div>

        {/* Info Teks */}
        <div
          className={cn(
            "ml-2 flex flex-col overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
            isCollapsed
              ? "w-0 opacity-0 pointer-events-none"
              : "w-auto opacity-100",
          )}
        >
          <span className="text-sm font-bold text-[#f4f1e8]">Admin User</span>
          <span className="text-[10px] font-medium text-[#f4f1e8]/70 uppercase tracking-widest">
            Fleet Manager
          </span>
        </div>
      </div>
      <div className="relative z-10 mt-auto border-t border-white/10 p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-[#f4f1e8]/72 transition hover:bg-white/8 hover:text-[#f4f1e8]"
        >
          <LogOut className="w-5 h-5 shrink-0" />

          <span
            className={cn(
              "transition-all duration-200 origin-left",
              isCollapsed ? "scale-0 opacity-0 w-0" : "scale-100 opacity-100",
            )}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
