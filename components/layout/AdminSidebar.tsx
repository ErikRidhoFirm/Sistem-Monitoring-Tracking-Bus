import Link from "next/link";

export function AdminSidebar() {
  return (
    <aside className="relative h-screen w-64 overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,#334a61_0%,#253545_100%)] p-4 text-sidebar-foreground shadow-[12px_0_40px_rgba(15,23,42,0.18)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04)_0%,transparent_18%,rgba(0,0,0,0.1)_100%)]" />
      <h1
        className="relative z-10 mb-6 text-xl font-bold text-[#f4f1e8]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        BusControl
      </h1>
      <nav className="relative z-10 space-y-2">
        <Link href="/admin" className="block rounded-xl bg-[linear-gradient(135deg,rgba(255,154,77,0.95)_0%,rgba(255,122,47,0.85)_100%)] p-2.5 text-[#f4f1e8] shadow-[0_12px_28px_rgba(255,122,47,0.22)]">
          Dashboard
        </Link>
        <Link href="/admin/buses" className="block rounded-xl p-2.5 text-[#f4f1e8]/72 hover:bg-white/8 hover:text-[#f4f1e8]">
          Bus
        </Link>
        <Link href="/admin/rfid" className="block rounded-xl p-2.5 text-[#f4f1e8]/72 hover:bg-white/8 hover:text-[#f4f1e8]">
          RFID
        </Link>
      </nav>
    </aside>
  );
}