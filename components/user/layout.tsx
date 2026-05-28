import { ReactNode } from "react";

import { UserSidebar } from "@/components/user/sidebar";
import { UserNavbar } from "@/components/user/navbar";

type UserLayoutProps = {
  children: ReactNode;
};

export function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="relative flex min-h-screen bg-background">
      <UserSidebar className="hidden md:flex" />

      <main className="relative min-h-screen flex-1 flex flex-col transition-all duration-200 md:ml-64">
        <UserNavbar />
        <div className="relative z-10 flex-1 p-4 md:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
