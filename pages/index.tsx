import { Manrope, Sora } from "next/font/google";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export default function Home() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const isLoggedIn = Boolean(session?.user);
  const departures = [
    { route: "Rute A", destination: "Gerbang Timur", eta: "03 min" },
    { route: "Rute C", destination: "Fakultas Teknik", eta: "07 min" },
    { route: "Rute B", destination: "Asrama Mahasiswa", eta: "11 min" },
  ];

  return (
    <div
      className={`${sora.variable} ${manrope.variable} min-h-screen bg-[#f7f9ff] text-[#1f3d3a]`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-mesh absolute inset-0" />
        <div className="gradient-orb orb-a absolute -top-28 -left-20 h-80 w-80 rounded-full" />
        <div className="gradient-orb orb-b absolute top-28 right-0 h-112 w-md rounded-full" />
        <div className="gradient-orb orb-c absolute bottom-8 left-1/3 h-72 w-72 rounded-full" />
      </div>

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 py-8 md:px-10 lg:px-16 lg:py-12">
        <header
          className="reveal flex items-center justify-between rounded-3xl border border-[#173330]/10 bg-white/70 px-5 py-4 shadow-[0_12px_36px_rgba(34,91,176,0.08)] backdrop-blur-md"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1f3d3a] text-sm font-bold tracking-wide text-[#f4f1e8]">
              BW
            </span>
            <div>
              <p
                style={{ fontFamily: "var(--font-display)" }}
                className="text-lg font-semibold leading-none"
              >
                Buswy
              </p>
              <p className="text-xs tracking-[0.18em] text-[#1f3d3a]/60 uppercase">
                Campus Transit
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
            <Link
              className="rounded-full border border-[#245bb0]/20 bg-white/80 px-4 py-2 text-xs tracking-[0.08em] uppercase transition hover:border-[#245bb0]/35 hover:bg-white"
              href="/realtime-map"
            >
              Live Map
            </Link>
            {isSessionPending ? (
              <span className="text-xs tracking-[0.08em] text-[#173330]/60 uppercase">
                Memuat Akun...
              </span>
            ) : isLoggedIn ? (
              <Link
                className="rounded-full border border-[#173330]/20 px-4 py-2 text-xs tracking-[0.08em] uppercase transition hover:border-[#173330]/35"
                href="/user"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                className="rounded-full bg-[#173330] px-4 py-2 text-xs tracking-[0.08em] text-[#f4f1e8] uppercase transition hover:bg-[#112a28]"
                href="/auth/login"
              >
                Login
              </Link>
            )}
          </nav>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#1f3d3a]/20 bg-white/80 text-[#173330] transition hover:bg-white md:hidden"
            aria-label="Buka menu"
            aria-expanded={isMobileSidebarOpen}
            aria-controls="mobile-sidebar"
          >
            <span className="relative h-4 w-5">
              <span className="absolute top-0 left-0 h-0.5 w-full rounded bg-current" />
              <span className="absolute top-1.5 left-0 h-0.5 w-full rounded bg-current" />
              <span className="absolute top-3 left-0 h-0.5 w-full rounded bg-current" />
            </span>
          </button>
        </header>

        <section className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div
              className="reveal space-y-5"
              style={{ animationDelay: "200ms" }}
            >
              <p className="inline-flex w-fit items-center rounded-full border border-[#245bb0]/20 bg-linear-to-r from-[#e7f0ff]/75 to-[#e9fbff]/75 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-[#1f3d3a]/80 uppercase">
                Transportasi Kampus Lebih Cerdas
              </p>
              <h1
                style={{ fontFamily: "var(--font-display)" }}
                className="text-5xl leading-[1.06] font-semibold tracking-tight text-[#173330] sm:text-6xl lg:text-7xl"
              >
                Naik Bus Kampus
                <span className="block text-[#e86f3f]">
                  Tanpa Menebak Waktu.
                </span>
              </h1>
              <p className="max-w-xl text-base leading-8 text-[#1f3d3a]/75 sm:text-lg">
                Pantau posisi bus real-time, cek kepadatan, dan pilih rute
                tercepat ke kelas berikutnya dalam satu tampilan yang bersih dan
                responsif.
              </p>
            </div>

            <div
              className="reveal flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "320ms" }}
            >
              <Link
                href="/realtime-map"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#1f3d3a] px-7 font-semibold text-[#f4f1e8] transition hover:bg-[#132b29]"
              >
                Buka Live Map
              </Link>
              <Button
                variant="outline"
                className="h-12 rounded-full border-[#245bb0]/25 bg-white/80 px-7 font-semibold text-[#1f3d3a] hover:bg-white"
              >
                Unduh Aplikasi
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Bus Aktif", value: "24" },
                { label: "Shelter Kampus", value: "38" },
                { label: "Ketepatan Waktu", value: "96%" },
              ].map((item, index) => (
                <article
                  key={item.label}
                  className="reveal rounded-2xl border border-[#245bb0]/15 bg-white/72 p-4 shadow-[0_8px_30px_rgba(36,91,176,0.08)] backdrop-blur"
                  style={{ animationDelay: `${420 + index * 110}ms` }}
                >
                  <p className="text-xs tracking-[0.16em] text-[#1f3d3a]/60 uppercase">
                    {item.label}
                  </p>
                  <p
                    style={{ fontFamily: "var(--font-display)" }}
                    className="mt-2 text-4xl font-semibold text-[#173330]"
                  >
                    {item.value}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside
            id="jadwal"
            className="reveal relative overflow-hidden rounded-[2rem] border border-[#245bb0]/20 bg-linear-to-br from-[#173330] via-[#214d79] to-[#3f6db0] p-6 text-[#f4f1e8] shadow-2xl shadow-[#245bb0]/25"
            style={{ animationDelay: "260ms" }}
          >
            <div className="absolute -right-8 -bottom-8 h-28 w-28 rounded-full border border-white/20" />
            <div className="absolute top-4 right-4 h-16 w-16 rounded-full bg-[#e86f3f]/25 blur-2xl" />

            <p className="text-xs tracking-[0.2em] text-[#f4f1e8]/70 uppercase">
              Live Departure Board
            </p>
            <h2
              style={{ fontFamily: "var(--font-display)" }}
              className="mt-3 text-3xl leading-tight font-semibold"
            >
              Shelter Utama
            </h2>

            <div className="mt-6 space-y-3">
              {departures.map((item, index) => (
                <div
                  key={item.route}
                  className="reveal flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3"
                  style={{ animationDelay: `${480 + index * 120}ms` }}
                >
                  <div>
                    <p className="text-sm font-bold text-[#ffe39f]">
                      {item.route}
                    </p>
                    <p className="text-sm text-[#f4f1e8]/75">
                      {item.destination}
                    </p>
                  </div>
                  <p
                    style={{ fontFamily: "var(--font-display)" }}
                    className="text-2xl font-semibold"
                  >
                    {item.eta}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm">
              <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-[#62f4da]" />
              Sinkronisasi posisi bus setiap 8 detik
            </div>
          </aside>
        </section>

        <section
          id="rute"
          className="grid items-center gap-6 rounded-[2rem] border border-[#245bb0]/15 bg-white/60 p-5 shadow-[0_12px_40px_rgba(36,91,176,0.08)] backdrop-blur-sm md:grid-cols-[0.9fr_1.1fr] md:p-8"
        >
          <div className="reveal space-y-4" style={{ animationDelay: "660ms" }}>
            <p className="text-xs tracking-[0.2em] text-[#1f3d3a]/60 uppercase">
              Campus Route Map
            </p>
            <h2
              style={{ fontFamily: "var(--font-display)" }}
              className="text-3xl leading-tight font-semibold text-[#173330] md:text-4xl"
            >
              Peta Rute Bus Kampus
              <span className="block text-[#e86f3f]">
                Dengan Pergerakan Real-Time
              </span>
            </h2>
            <p className="max-w-md text-sm leading-7 text-[#1f3d3a]/75 md:text-base">
              Jalur utama divisualkan dengan titik shelter dan indikator bus
              bergerak. Mahasiswa dapat melihat arah perjalanan tanpa membuka
              peta eksternal.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-1 text-center">
              {[
                { label: "Rute Aktif", value: "6" },
                { label: "Shelter", value: "38" },
                { label: "Update", value: "8s" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#245bb0]/15 bg-linear-to-br from-[#ffffff] to-[#eef5ff] px-3 py-2"
                >
                  <p className="text-[11px] tracking-[0.14em] text-[#1f3d3a]/55 uppercase">
                    {item.label}
                  </p>
                  <p
                    style={{ fontFamily: "var(--font-display)" }}
                    className="mt-1 text-2xl font-semibold text-[#173330]"
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal" style={{ animationDelay: "760ms" }}>
            <div className="map-shell relative overflow-hidden rounded-[1.75rem] border border-[#245bb0]/20 bg-linear-to-br from-[#10222f] via-[#1f3950] to-[#2f4d70] p-4 shadow-xl shadow-[#245bb0]/25 md:p-5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(122,183,255,0.3),transparent_38%),radial-gradient(circle_at_80%_75%,rgba(98,244,218,0.22),transparent_42%)]" />
              <svg
                viewBox="0 0 560 360"
                className="relative z-10 h-full w-full"
              >
                <g opacity="0.22" stroke="#f4f1e8" strokeWidth="1">
                  <path d="M40 55 H520" />
                  <path d="M40 120 H520" />
                  <path d="M40 185 H520" />
                  <path d="M40 250 H520" />
                  <path d="M40 315 H520" />
                  <path d="M80 20 V340" />
                  <path d="M170 20 V340" />
                  <path d="M260 20 V340" />
                  <path d="M350 20 V340" />
                  <path d="M440 20 V340" />
                </g>

                <path
                  className="route-line"
                  d="M65 285 C120 255, 155 185, 210 185 C258 185, 290 262, 330 262 C388 262, 412 122, 475 122"
                  fill="none"
                  stroke="#ffe39f"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {[
                  { x: 65, y: 285, name: "Asrama" },
                  { x: 210, y: 185, name: "Perpus" },
                  { x: 330, y: 262, name: "Teknik" },
                  { x: 475, y: 122, name: "Gerbang" },
                ].map((stop) => (
                  <g key={stop.name}>
                    <circle cx={stop.x} cy={stop.y} r="8" fill="#62f4da" />
                    <circle
                      cx={stop.x}
                      cy={stop.y}
                      r="16"
                      fill="none"
                      stroke="#62f4da"
                      strokeOpacity="0.35"
                    />
                    <text
                      x={stop.x + 14}
                      y={stop.y - 10}
                      fill="#f4f1e8"
                      fontSize="12"
                      fontWeight="700"
                    >
                      {stop.name}
                    </text>
                  </g>
                ))}
              </svg>

              <div className="moving-bus absolute top-[74%] left-[10%] rounded-full border border-[#173330] bg-[#e86f3f] px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-white uppercase shadow-lg shadow-[#e86f3f]/40">
                Bus A12
              </div>
            </div>
          </div>
        </section>

        <section id="fitur" className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Estimasi Akurat",
              desc: "Perhitungan ETA mempertimbangkan lalu lintas internal kampus dan jam sibuk fakultas.",
            },
            {
              title: "Status Kepadatan",
              desc: "Lihat indikator kursi kosong sebelum naik untuk perjalanan yang lebih nyaman.",
            },
            {
              title: "Notifikasi Cerdas",
              desc: "Dapatkan pengingat otomatis ketika bus tujuanmu mendekati shelter favorit.",
            },
          ].map((feature, index) => (
            <article
              key={feature.title}
              className="reveal group rounded-3xl border border-[#1f3d3a]/15 bg-white/65 p-6 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${720 + index * 120}ms` }}
            >
              <h3
                style={{ fontFamily: "var(--font-display)" }}
                className="text-2xl font-semibold text-[#173330]"
              >
                {feature.title}
              </h3>
              <div className="my-4 h-px w-12 bg-[#e86f3f] transition-all duration-300 group-hover:w-20" />
              <p className="text-sm leading-7 text-[#1f3d3a]/75">
                {feature.desc}
              </p>
            </article>
          ))}
        </section>

        <footer
          className="reveal rounded-[2rem] border border-[#1f3d3a]/15 bg-[#173330] p-6 text-[#f4f1e8] shadow-xl shadow-[#173330]/20 md:p-8"
          style={{ animationDelay: "820ms" }}
        >
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4f1e8] text-sm font-bold tracking-wide text-[#173330]">
                  BW
                </span>
                <div>
                  <p
                    style={{ fontFamily: "var(--font-display)" }}
                    className="text-2xl font-semibold leading-none"
                  >
                    Buswy
                  </p>
                  <p className="text-xs tracking-[0.18em] text-[#f4f1e8]/65 uppercase">
                    Campus Transit
                  </p>
                </div>
              </div>
              <p className="max-w-md text-sm leading-7 text-[#f4f1e8]/75">
                Platform mobilitas kampus untuk membantu mahasiswa berpindah
                antar fakultas dengan cepat, nyaman, dan terprediksi.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs tracking-[0.18em] text-[#f4f1e8]/60 uppercase">
                Navigasi
              </p>
              <div className="flex flex-col gap-2 text-sm text-[#f4f1e8]/85">
                <a href="#rute" className="transition hover:text-[#ffe39f]">
                  Peta Rute
                </a>
                <a href="#jadwal" className="transition hover:text-[#ffe39f]">
                  Jadwal Real-Time
                </a>
                <a href="#fitur" className="transition hover:text-[#ffe39f]">
                  Fitur
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs tracking-[0.18em] text-[#f4f1e8]/60 uppercase">
                Kontak
              </p>
              <div className="text-sm leading-7 text-[#f4f1e8]/85">
                <p>transport@kampus.ac.id</p>
                <p>+62 21 5000 789</p>
                <p>Operational: 06.00 - 22.00</p>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-white/15 pt-4 text-xs tracking-[0.12em] text-[#f4f1e8]/65 uppercase">
            © {new Date().getFullYear()} Buswy Mobility Systems
          </div>
        </footer>
      </main>

      <div
        className={`fixed inset-0 z-50 bg-[#0f2523]/45 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${
          isMobileSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="mobile-sidebar"
        className={`fixed top-0 right-0 z-60 h-full w-[86vw] max-w-sm border-l border-[#1f3d3a]/20 bg-[#f4f1e8] px-6 py-6 shadow-2xl transition-transform duration-300 md:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isMobileSidebarOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#173330] text-xs font-bold tracking-wide text-[#f4f1e8]">
              BW
            </span>
            <p
              style={{ fontFamily: "var(--font-display)" }}
              className="text-xl font-semibold text-[#173330]"
            >
              Buswy
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#1f3d3a]/20 text-[#173330]"
            aria-label="Tutup menu"
          >
            ✕
          </button>
        </div>

        <nav className="mt-10 flex flex-col gap-3 text-base font-semibold text-[#173330]">
          <Link
            href="/realtime-map"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="rounded-xl border border-[#1f3d3a]/15 bg-white/70 px-4 py-3 transition hover:border-[#1f3d3a]/35"
          >
            Live Map
          </Link>
          {isLoggedIn ? (
            <Link
              href="/user"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="rounded-xl border border-[#1f3d3a]/15 bg-white/70 px-4 py-3 transition hover:border-[#1f3d3a]/35"
            >
              Dashboard User
            </Link>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="rounded-xl border border-[#1f3d3a]/15 bg-white/70 px-4 py-3 transition hover:border-[#1f3d3a]/35"
            >
              Login
            </Link>
          )}
        </nav>

        <div className="mt-8 space-y-3 rounded-2xl border border-[#1f3d3a]/15 bg-white/75 p-4 text-sm text-[#1f3d3a]/80">
          <p className="text-xs tracking-[0.14em] text-[#1f3d3a]/60 uppercase">
            Status Hari Ini
          </p>
          <p>24 bus aktif • 38 shelter • update tiap 8 detik</p>
          <Link
            href="/realtime-map"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#173330] text-[#f4f1e8] transition hover:bg-[#132b29]"
          >
            Buka Live Map
          </Link>
        </div>
      </aside>

      <style jsx>{`
        .reveal {
          opacity: 0;
          transform: translateY(16px);
          animation: lift-in 0.8s cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
        }

        .pulse-dot {
          animation: pulse 1.8s ease-in-out infinite;
        }

        .aurora-mesh {
          background:
            radial-gradient(
              circle at 12% 18%,
              rgba(122, 183, 255, 0.42),
              transparent 30%
            ),
            radial-gradient(
              circle at 82% 20%,
              rgba(98, 244, 218, 0.34),
              transparent 36%
            ),
            radial-gradient(
              circle at 52% 78%,
              rgba(255, 177, 102, 0.28),
              transparent 34%
            );
          animation: mesh-float 14s ease-in-out infinite alternate;
        }

        .gradient-orb {
          filter: blur(60px);
          opacity: 0.55;
          animation: orb-drift 18s ease-in-out infinite;
        }

        .orb-a {
          background: #8bc6ff;
        }

        .orb-b {
          background: #a4f4eb;
          animation-delay: 2s;
        }

        .orb-c {
          background: #ffd7a8;
          animation-delay: 4s;
        }

        .map-shell {
          min-height: 320px;
        }

        .route-line {
          stroke-dasharray: 10 12;
          animation: route-flow 4.5s linear infinite;
        }

        .moving-bus {
          animation: bus-run 9s cubic-bezier(0.25, 0.7, 0.2, 1) infinite;
        }

        @keyframes lift-in {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(0.9);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.25);
            opacity: 1;
          }
        }

        @keyframes route-flow {
          to {
            stroke-dashoffset: -220;
          }
        }

        @keyframes bus-run {
          0% {
            left: 10%;
            top: 74%;
            transform: scale(0.94);
          }
          22% {
            left: 31%;
            top: 54%;
            transform: scale(1);
          }
          47% {
            left: 43%;
            top: 54%;
            transform: scale(0.96);
          }
          72% {
            left: 63%;
            top: 68%;
            transform: scale(1);
          }
          100% {
            left: 81%;
            top: 36%;
            transform: scale(0.95);
          }
        }

        @keyframes mesh-float {
          0% {
            transform: scale(1) translate3d(0, 0, 0);
          }
          100% {
            transform: scale(1.08) translate3d(1.5%, -1%, 0);
          }
        }

        @keyframes orb-drift {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(1.2rem, -0.8rem, 0) scale(1.08);
          }
        }

        @media (max-width: 768px) {
          .map-shell {
            min-height: 280px;
          }
        }
      `}</style>
    </div>
  );
}
