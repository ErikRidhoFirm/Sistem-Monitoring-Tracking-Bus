export function AdminNavbar() {
  return (
    <div className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-white/10 bg-[linear-gradient(135deg,#24384d_0%,#345877_48%,#4b77ad_100%)] px-4 py-4 text-[#f4f1e8] backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.18)]">
      <h2
        className="font-semibold text-[#f4f1e8]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Admin Dashboard
      </h2>
    </div>
  );
}