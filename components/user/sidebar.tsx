"use client";

import {
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

import { buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const defaultItems: SidebarItem[] = [
  { label: "Dashboard", href: "/user", icon: LayoutDashboard },
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
      className={cn("flex h-full w-72 flex-col border-r bg-card", className)}
    >
      <div className="border-b px-4 py-4">
        <p className="text-sm font-semibold text-foreground">User Panel</p>
        <p className="text-xs text-muted-foreground">
          Kelola akun dan preferensi kamu
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active =
            router.pathname === item.href ||
            (item.href !== "/user" && router.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({
                  variant: active ? "secondary" : "ghost",
                  size: "sm",
                }),
                "w-full justify-start",
              )}
            >
              <item.icon data-icon="inline-start" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full justify-start",
          )}
        >
          <LogOut data-icon="inline-start" />
          Logout
        </button>
      </div>
    </aside>
  );
}
