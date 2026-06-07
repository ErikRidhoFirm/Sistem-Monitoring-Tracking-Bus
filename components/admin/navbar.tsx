import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type AdminNavbarProps = {
  onMobileMenuClick: () => void;
  isMobileSidebarOpen: boolean;
};

export function AdminNavbar({
  onMobileMenuClick,
  isMobileSidebarOpen,
}: AdminNavbarProps) {
  return (
    <div
      data-admin-navbar
      className="fixed top-0 left-0 right-0 z-30 border-b border-white/15 bg-[linear-gradient(135deg,#17355a_0%,#214d79_52%,#5b8de3_100%)] py-3 text-[#f4f1e8] backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.18)] transition-all duration-200"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        {/* Branding */}
        <div
          className="shrink-0 text-xl font-semibold text-[rgb(255,227,159)] drop-shadow-[0_0_10px_rgba(255,227,159,0.42)] drop-shadow-[0_0_22px_rgba(255,227,159,0.24)] md:text-2xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Buswy Admin
        </div>

        {/* Mobile menu */}
        <div className="flex items-center gap-1 shrink-0 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label={isMobileSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
            aria-expanded={isMobileSidebarOpen}
            onClick={onMobileMenuClick}
            className="h-9 w-9 text-[#f4f1e8]/80 hover:bg-white/10 hover:text-[#f4f1e8]"
          >
            {isMobileSidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
