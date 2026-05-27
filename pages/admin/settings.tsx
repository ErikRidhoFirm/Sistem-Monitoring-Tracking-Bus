import { AdminLayout } from "@/components/admin/layout";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminOverview } from "@/lib/hooks/use-admin-overview";
import { BadgeCheck, BusFront, CreditCard, MapPinned, ReceiptText, Users } from "lucide-react";

export default function AdminSettingsPage() {
  const overviewQuery = useAdminOverview();

  const metrics = [
    {
      label: "Users",
      value: overviewQuery.data?.users ?? 0,
      icon: Users,
      iconClassName: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
    },
    {
      label: "Buses",
      value: overviewQuery.data?.buses ?? 0,
      icon: BusFront,
      iconClassName: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    },
    {
      label: "Routes",
      value: overviewQuery.data?.routes ?? 0,
      icon: MapPinned,
      iconClassName: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
    },
    {
      label: "Stations",
      value: overviewQuery.data?.stations ?? 0,
      icon: BadgeCheck,
      iconClassName: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    },
    {
      label: "Cards",
      value: overviewQuery.data?.cards ?? 0,
      icon: CreditCard,
      iconClassName: "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200",
    },
    {
      label: "Transactions",
      value: overviewQuery.data?.transactions ?? 0,
      icon: ReceiptText,
      iconClassName: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="System Overview"
          title="Admin Settings & Overview"
          description="Ringkasan data utama untuk monitoring kesiapan operasional aplikasi."
        />

        <Card>
          <CardHeader>
            <CardTitle>Statistik Sistem</CardTitle>
          </CardHeader>
          <CardContent>
            {overviewQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Memuat ringkasan sistem...</p>
            ) : null}

            {overviewQuery.isError ? (
              <p className="text-sm text-destructive">
                {overviewQuery.error instanceof Error
                  ? overviewQuery.error.message
                  : "Gagal memuat ringkasan sistem"}
              </p>
            ) : null}

            {!overviewQuery.isLoading && !overviewQuery.isError && overviewQuery.data ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {metrics.map((metric) => (
                  <MetricCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    icon={metric.icon}
                    iconClassName={metric.iconClassName}
                  />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {label}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Ringkasan metrik sistem untuk kontrol operasional.
          </p>
        </div>
        <div className={`rounded-2xl p-3 ${iconClassName}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p
        className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
    </div>
  );
}
