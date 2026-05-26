export function AdminNavbar() {
  return (
    <div className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-white/50 bg-white/70 px-4 py-4 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <h2
        className="font-semibold text-[#173330]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Admin Dashboard
      </h2>
    </div>
  );
}