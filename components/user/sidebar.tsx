"use client";

import {
  History,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Settings,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const defaultItems: SidebarItem[] = [
  { label: "Dashboard", href: "/user", icon: LayoutDashboard },
  { label: "Riwayat Transaksi", href: "/user/history", icon: History },
  { label: "Tracking Bus", href: "/realtime-map", icon: MapPinned },
  { label: "Penumpang", href: "/user/penumpang", icon: Users },
  { label: "Profile", href: "/user/profile", icon: User },
  { label: "Settings", href: "/user/settings", icon: Settings },
];

type UserSidebarProps = {
  className?: string;
  items?: SidebarItem[];
};

export function UserSidebar({
  className,
  items = defaultItems,
}: UserSidebarProps) {
  const router = useRouter();

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
        "fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden border-r border-white/10 bg-[linear-gradient(135deg,#24384d_0%,#345877_48%,#4b77ad_100%)] text-sidebar-foreground shadow-[12px_0_40px_rgba(15,23,42,0.18)] transition-all duration-200 ease-in-out",
        className,
      )}
      style={{ width: 256 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04)_0%,transparent_18%,rgba(0,0,0,0.08)_100%)]" />
      <div className="relative z-10 mb-6 px-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="transition-all duration-300 origin-left scale-100 opacity-100 w-auto">
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
        </div>
      </div>

      <nav className="relative z-10 flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const active =
            router.pathname === item.href ||
            (item.href !== "/user" && router.pathname.startsWith(item.href));

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
              <span className="flex w-5 shrink-0 items-center justify-center">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="ml-3 inline-block overflow-hidden whitespace-nowrap transition-all duration-200 origin-left">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="relative z-10 mt-auto border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-[#f4f1e8]/72 transition hover:bg-white/8 hover:text-[#f4f1e8]"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
