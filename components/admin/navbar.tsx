import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AdminNavbar() {
  return (
    <div className="sticky top-0 z-50 border-b border-white/50 bg-white/70 py-3 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        {/* Branding */}
        <div
          className="shrink-0 font-semibold text-[#173330]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Buswy Admin
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" type="button" className="h-9 w-9 text-[#173330]/80 hover:bg-slate-100 hover:text-[#173330]">
            <Bell className="h-4 w-4" />
          </Button>
          {/* profile icon removed */}
        </div>
      </div>
    </div>
  );
}
