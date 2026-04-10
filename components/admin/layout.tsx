import { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/sidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar className="hidden md:flex" />

      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
