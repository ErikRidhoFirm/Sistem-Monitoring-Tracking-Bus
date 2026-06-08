import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
  footerQuestion: string;
  footerLinkHref: string;
  footerLinkLabel: string;
};

export function AuthShell({
  badge,
  title,
  description,
  children,
  footerQuestion,
  footerLinkHref,
  footerLinkLabel,
}: AuthShellProps) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#f7f9ff] text-[#1f3d3a]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-mesh absolute inset-0" />
        <div className="gradient-orb orb-a absolute -top-28 -left-20 h-80 w-80 rounded-full" />
        <div className="gradient-orb orb-b absolute top-28 right-0 h-112 w-72 rounded-full" />
        <div className="gradient-orb orb-c absolute bottom-8 left-1/3 h-72 w-72 rounded-full" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-6 md:px-10 lg:px-16">
        <section className="reveal mx-auto w-full max-w-xl" style={{ animationDelay: "120ms" }}>
          <div className="rounded-[2rem] border border-[#245bb0]/15 bg-white/75 p-4 shadow-[0_20px_60px_rgba(36,91,176,0.14)] backdrop-blur-md sm:p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1f3d3a] text-sm font-bold tracking-wide text-[#f4f1e8]">
                  BW
                </span>
                <div>
                  <p
                    style={{ fontFamily: "var(--font-display)" }}
                    className="text-lg font-semibold leading-none text-[#173330]"
                  >
                    Buswy
                  </p>
                  <p className="text-xs tracking-[0.18em] text-[#1f3d3a]/60 uppercase">
                    Campus Transit
                  </p>
                </div>
              </div>

              <Link
                href="/"
                className="rounded-full bg-gradient-to-br from-[#80c7ff] to-[#e6f4ff] border border-[#245bb0]/15 px-4 py-2 text-sm font-semibold text-[#1f3d3a] transition-all duration-200 hover:from-[#94d1ff] hover:to-[#f0f8ff] hover:shadow-md flex items-center gap-2"
              >
                <span>Landing Page</span>
              </Link>
            </div>

            <div className="mb-6 space-y-2">
              <p className="inline-flex w-fit items-center rounded-full border border-[#245bb0]/20 bg-linear-to-r from-[#e7f0ff]/75 to-[#e9fbff]/75 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-[#1f3d3a]/80 uppercase">
                {badge}
              </p>
              <h2
                style={{ fontFamily: "var(--font-display)" }}
                className="text-3xl leading-tight font-semibold text-[#173330] sm:text-4xl"
              >
                {title}
              </h2>
              <p className="max-w-lg text-sm leading-7 text-[#1f3d3a]/75 sm:text-base">
                {description}
              </p>
            </div>

            {children}

            <p className="mt-6 text-center text-sm text-[#1f3d3a]/70">
              {footerQuestion} {" "}
              <Link
                href={footerLinkHref}
                className="font-semibold text-[#173330] underline-offset-4 hover:underline"
              >
                {footerLinkLabel}
              </Link>
            </p>
          </div>
        </section>
      </div>

      <style jsx>{`
        .reveal {
          opacity: 0;
          transform: translateY(16px);
          animation: lift-in 0.8s cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
        }

        .aurora-mesh {
          background:
            radial-gradient(circle at 12% 18%, rgba(122, 183, 255, 0.42), transparent 30%),
            radial-gradient(circle at 82% 20%, rgba(98, 244, 218, 0.34), transparent 36%),
            radial-gradient(circle at 52% 78%, rgba(255, 177, 102, 0.28), transparent 34%);
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

        @keyframes lift-in {
          to {
            opacity: 1;
            transform: translateY(0);
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
      `}</style>
    </main>
  );
}