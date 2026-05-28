import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

export function UserNavbar() {
  return (
    <div className="sticky top-0 z-50 border-b border-white/15 bg-[linear-gradient(135deg,#17355a_0%,#214d79_52%,#5b8de3_100%)] py-3 text-[#f4f1e8] backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.18)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        {/* Branding */}
        <div
          className="shrink-0 text-xl font-semibold text-[rgb(255,227,159)] drop-shadow-[0_0_10px_rgba(255,227,159,0.42)] drop-shadow-[0_0_22px_rgba(255,227,159,0.24)] md:text-2xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Buswy
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" type="button" className="h-9 w-9 text-[#f4f1e8]/80 hover:bg-white/10 hover:text-[#f4f1e8]">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
