import { AdminLayout } from "@/components/admin/layout";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminOverview } from "@/lib/hooks/use-admin-overview";

export default function AdminSettingsPage() {
  const overviewQuery = useAdminOverview();

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
              <div className="grid gap-3 md:grid-cols-3">
                <MetricCard label="Users" value={overviewQuery.data.users} />
                <MetricCard label="Buses" value={overviewQuery.data.buses} />
                <MetricCard label="Routes" value={overviewQuery.data.routes} />
                <MetricCard label="Stations" value={overviewQuery.data.stations} />
                <MetricCard label="Cards" value={overviewQuery.data.cards} />
                <MetricCard
                  label="Transactions"
                  value={overviewQuery.data.transactions}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-input p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
