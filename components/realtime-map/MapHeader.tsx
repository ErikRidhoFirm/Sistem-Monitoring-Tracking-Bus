import Link from "next/link";

export function MapHeader() {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#245bb0]/12 bg-white/70 px-5 py-4 shadow-[0_12px_36px_rgba(36,91,176,0.08)] backdrop-blur-md">
      <div>
        <p className="text-xs tracking-[0.2em] text-[#173330]/60 uppercase">
          Realtime Command Center
        </p>
        <h1
          style={{ fontFamily: "var(--font-display)" }}
          className="mt-2 text-3xl font-semibold md:text-4xl"
        >
          Buswy Live Map
        </h1>
      </div>
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-full border border-[#245bb0]/20 bg-white/85 px-5 text-sm font-semibold transition hover:bg-white"
      >
        Kembali ke Landing
      </Link>
    </header>
  );
}
