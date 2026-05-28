import { useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SelectMenu from "@/components/ui/select-menu";
import { CreditCard, Sparkles, Users, Wifi } from "lucide-react";
import { useAdminBuses } from "@/lib/hooks/use-admin-buses";
import { useAdminOverviewByBus } from "@/lib/hooks/use-admin-overview";
import { useAdminProfitSummary } from "@/lib/hooks/use-admin-profit-summary";
import { useAdminTodayTransactionsByBus } from "@/lib/hooks/use-admin-today-transactions";
import { AdminPageHeader } from "@/components/admin/page-header";

const dashboardSurfaceClassName =
  "rounded-3xl border border-border/50 bg-card/80 shadow-[0_14px_42px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-transparent hover:bg-transparent hover:shadow-[0_20px_54px_rgba(15,23,42,0.1)]";

const dashboardSoftCardClassName =
  "rounded-3xl border border-border/40 bg-background/80 shadow-[0_10px_28px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-transparent hover:bg-transparent hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]";



export default function AdminPage() {
  const [selectedBusId, setSelectedBusId] = useState<string | "ALL">("ALL");
  const overviewQuery = useAdminOverviewByBus(selectedBusId);
  const busesQuery = useAdminBuses("");
  const profitQuery = useAdminProfitSummary(selectedBusId);
  const transactionsQuery = useAdminTodayTransactionsByBus(5, selectedBusId);

  const selectedBus = busesQuery.data?.buses.find((b) => b.id === selectedBusId);
  const selectedBusLabel =
    selectedBusId === "ALL"
      ? "semua armada"
      : `${selectedBus?.busCode ?? selectedBusId} ${selectedBus?.plateNumber ? `(${selectedBus.plateNumber})` : ""}`;

  const busOptions = [
    { value: "ALL", label: "All bus" },
    ...(busesQuery.data?.buses.map((bus) => ({
      value: bus.id,
      label: `${bus.busCode} - ${bus.plateNumber}`,
    })) ?? []),
  ];

  const formatCurrency = (value: number | undefined) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value ?? 0);

  const metricItems = [
    {
      label: selectedBusId === "ALL" ? "Total Alat" : "Status Alat",
      value: overviewQuery.data?.devices ?? "—",
      description:
        selectedBusId === "ALL"
          ? "Perangkat IoT dan sensor yang terdaftar."
          : `Perangkat IoT dan sensor pada ${selectedBusLabel}.`,
      icon: Sparkles,
      href: "/admin/iot-devices",
      iconClassName: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
    },
    {
      label: selectedBusId === "ALL" ? "Total Bus Aktif" : "Status Bus",
      value: overviewQuery.data?.activeBuses ?? "—",
      description:
        selectedBusId === "ALL"
          ? "Jumlah armada bus yang sedang aktif."
          : `Status operasional untuk ${selectedBusLabel}.`,
      icon: Wifi,
      href: "/admin/buses",
      iconClassName: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
    },
    {
      label: selectedBusId === "ALL" ? "Total Kartu Aktif" : "Status Kartu Aktif",
      value: overviewQuery.data?.activeCards ?? "—",
      description:
        selectedBusId === "ALL"
          ? "Jumlah kartu RFID yang saat ini aktif."
          : `Kartu yang tercatat pada ${selectedBusLabel}.`,
      icon: CreditCard,
      href: "/admin/cards",
      iconClassName: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    },
    {
      label: selectedBusId === "ALL" ? "Total User" : "Status User",
      value: overviewQuery.data?.users ?? "—",
      description:
        selectedBusId === "ALL"
          ? "Jumlah pengguna yang terdaftar dalam sistem."
          : `Pengguna yang tercatat pada ${selectedBusLabel}.`,
      icon: Users,
      href: "/admin/users",
      iconClassName: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    },
  ];

  const profitItems = [
    {
      label: "Profit Harian",
      value: profitQuery.data?.dailyProfit,
      description: "Akumulasi transaksi hari ini.",
    },
    {
      label: "Profit Mingguan",
      value: profitQuery.data?.weeklyProfit,
      description: "Akumulasi transaksi sejak awal minggu.",
    },
    {
      label: "Profit Bulanan",
      value: profitQuery.data?.monthlyProfit,
      description: "Akumulasi transaksi sejak awal bulan.",
    },
    {
      label: "Profit Tahunan",
      value: profitQuery.data?.yearlyProfit,
      description: "Akumulasi transaksi sejak awal tahun.",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <AdminPageHeader
          eyebrow="BusControl Admin"
          title="Dashboard Operasional"
          description="Ringkasan data dan 5 transaksi terakhir hari ini."
          actions={
            <>
            <SelectMenu
              value={selectedBusId}
              onValueChange={(nextValue) => setSelectedBusId(nextValue as string | "ALL")}
              options={busOptions}
              placeholder="Filter bus"
              searchPlaceholder="Cari bus"
              emptyMessage="Bus tidak ditemukan."
              className="w-64"
              triggerClassName="h-10"
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-10 rounded-full border border-white/15 bg-white/10 px-4 text-[#f4f1e8] shadow-sm hover:bg-white/15"
              onClick={() => {
                overviewQuery.refetch();
                busesQuery.refetch();
                profitQuery.refetch();
                transactionsQuery.refetch();
              }}
              disabled={
                overviewQuery.isFetching ||
                busesQuery.isFetching ||
                profitQuery.isFetching ||
                transactionsQuery.isFetching
              }
            >
              Refresh data
            </Button>
            <Link href="/admin/iot-devices">
              <Button size="sm" className="h-10 rounded-full bg-[linear-gradient(135deg,#ff9a4df2_0%,#ff7a2fd9_100%)] px-4 text-white shadow-[0_12px_30px_rgba(255,122,47,0.28)] hover:opacity-95">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>Tambah Sensor Baru
              </Button>
            </Link>
            </>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricItems.map((metric) => {
            const Icon = metric.icon;
            const cardContent = (
              <Card className={dashboardSurfaceClassName + " p-6"}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="mt-4 text-3xl font-semibold tracking-tight">
                      {metric.value}
                    </p>
                  </div>
                  <div className={`rounded-2xl p-3 ${metric.iconClassName ?? "bg-slate-100 text-slate-900"}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <p className="mt-5 text-sm text-muted-foreground">{metric.description}</p>
              </Card>
            );

            return metric.href ? (
              <Link key={metric.label} href={metric.href} className="group">
                {cardContent}
              </Link>
            ) : (
              <div key={metric.label}>{cardContent}</div>
            );
          })}
        </section>

        <section>
          <Card className={dashboardSurfaceClassName}>
            <CardHeader>
              <CardTitle>Ringkasan Profit</CardTitle>
              <CardDescription>
                Nilai profit utama untuk {selectedBusLabel} dalam empat rentang waktu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!profitQuery.isLoading && !profitQuery.isError ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {profitItems.map((item) => (
                    <Card
                      key={item.label}
                      className={dashboardSoftCardClassName + " p-5"}
                    >
                      <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                        {formatCurrency(item.value)}
                      </p>
                      <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
                    </Card>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className={dashboardSurfaceClassName}>
            <CardHeader>
              <CardTitle>5 Transaksi Terakhir Hari Ini</CardTitle>
              <CardDescription>
                Menampilkan transaksi pengguna dari awal hari hingga sekarang untuk {selectedBusLabel}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Memuat transaksi...</p>
              ) : null}

              {transactionsQuery.isError ? (
                <p className="text-sm text-destructive">
                  {transactionsQuery.error instanceof Error
                    ? transactionsQuery.error.message
                    : "Gagal memuat transaksi."}
                </p>
              ) : null}

              {!transactionsQuery.isLoading && !transactionsQuery.isError ? (
                <div className="space-y-4">
                  {transactionsQuery.data?.transactions.length ? (
                    transactionsQuery.data.transactions.map((item) => (
                      <Link
                        key={item.id}
                        href={`/admin/rfid/${encodeURIComponent(item.card.rfidTag)}`}
                        className="group block"
                      >
                        <Card className={dashboardSoftCardClassName + " p-4"}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-foreground">
                                {item.type === "IN" ? "Tap In" : item.type === "OUT" ? "Tap Out" : "Penalty"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.card.user?.name ?? item.card.rfidTag} • {item.bus.busCode}
                              </p>
                              <p className="mt-1 text-sm font-medium text-foreground">
                                {formatCurrency(item.amount)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {new Intl.DateTimeFormat("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).format(new Date(item.createdAt))}
                              </p>
                              <p className="text-sm font-semibold">
                                {item.stationName ?? "Lokasi tidak tersedia"}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Belum ada transaksi hari ini.
                    </p>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminLayout>
  );
}
// import AdminLayout from "@/components/layout/AdminLayout";

// export default function Dashboard() {
//   return (
//     <AdminLayout>
//       <div className="grid grid-cols-3 gap-4">
//         <div className="bg-card p-4 rounded-xl border border-border">
//           <p className="text-muted-foreground">Total Bus</p>
//           <h2 className="text-2xl font-bold">10</h2>
//         </div>
//         <div className="bg-card p-4 rounded-xl border border-border">
//           <p className="text-muted-foreground">RFID</p>
//           <h2 className="text-2xl font-bold">20</h2>
//         </div>
//       </div>
//     </AdminLayout>
//   );
// }