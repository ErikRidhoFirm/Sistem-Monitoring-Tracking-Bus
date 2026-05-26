import { useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Sparkles, Users, Wifi } from "lucide-react";
import { useAdminBuses } from "@/lib/hooks/use-admin-buses";
import { useAdminOverviewByBus } from "@/lib/hooks/use-admin-overview";
import { useAdminProfitSummary } from "@/lib/hooks/use-admin-profit-summary";
import { useAdminTodayTransactionsByBus } from "@/lib/hooks/use-admin-today-transactions";



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
        <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              BusControl Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Dashboard Operasional
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Ringkasan data dan 5 transaksi terakhir hari ini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Filter bus"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary"
              value={selectedBusId}
              onChange={(event) => setSelectedBusId(event.target.value as string | "ALL")}
            >
              <option value="ALL">All bus</option>
              {busesQuery.data?.buses.map((bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.busCode} - {bus.plateNumber}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="secondary"
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
              <Button size="sm">Add new sensor</Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricItems.map((metric) => {
            const Icon = metric.icon;
            const cardContent = (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-colors duration-150 ease-in-out hover:border-primary hover:bg-primary/5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="mt-4 text-3xl font-semibold tracking-tight">
                      {metric.value}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <p className="mt-5 text-sm text-muted-foreground">{metric.description}</p>
              </div>
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
          <Card>
            <CardHeader>
              <CardTitle>Profit Bus</CardTitle>
              <CardDescription>
                Menampilkan profit harian, mingguan, dan bulanan untuk {selectedBusLabel}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profitQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Memuat profit...</p>
              ) : null}

              {profitQuery.isError ? (
                <p className="text-sm text-destructive">
                  {profitQuery.error instanceof Error
                    ? profitQuery.error.message
                    : "Gagal memuat profit."}
                </p>
              ) : null}

              {!profitQuery.isLoading && !profitQuery.isError ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {profitItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-3xl border border-border bg-background p-5 shadow-sm"
                    >
                      <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                        {formatCurrency(item.value)}
                      </p>
                      <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
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
                        className="group block rounded-3xl border border-border bg-background p-4 transition-colors duration-150 ease-in-out hover:border-primary hover:bg-primary/5"
                      >
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