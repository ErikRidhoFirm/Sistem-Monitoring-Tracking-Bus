import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function AdminPageHeader({
  eyebrow = "Admin Panel",
  title,
  description,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,#17355a_0%,#214d79_52%,#5b8de3_100%)] p-6 text-white shadow-[0_18px_50px_rgba(36,91,176,0.16)] md:p-8",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_26%)]" />
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full border border-white/20" />
      <div className="pointer-events-none absolute top-4 right-4 h-20 w-20 rounded-full bg-white/12 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl space-y-4">
          <p className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-white/90 uppercase">
            {eyebrow}
          </p>
          <div className="space-y-3">
            <h1
              className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? <div className="relative z-10 flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}