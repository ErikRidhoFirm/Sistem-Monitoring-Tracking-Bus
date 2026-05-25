import { useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, CreditCard, ReceiptText, Sparkles, Users, Wifi } from "lucide-react";
import { useAdminBuses } from "@/lib/hooks/use-admin-buses";
import { useAdminOverview } from "@/lib/hooks/use-admin-overview";
import { useAdminProfitSummary } from "@/lib/hooks/use-admin-profit-summary";
import { useAdminTodayTransactions } from "@/lib/hooks/use-admin-today-transactions";



export default function AdminPage() {
  const [selectedBusId, setSelectedBusId] = useState<string | "ALL">("ALL");
  const overviewQuery = useAdminOverview();
  const busesQuery = useAdminBuses("");
  const profitQuery = useAdminProfitSummary(selectedBusId);
  const transactionsQuery = useAdminTodayTransactions(5);

  const formatCurrency = (value: number | undefined) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value ?? 0);

  const metricItems = [
    {
      label: "Total Alat",
      value: overviewQuery.data?.devices ?? "—",
      description: "Perangkat IoT dan sensor yang terdaftar.",
      icon: Sparkles,
      href: "/admin/iot-devices",
    },
    {
      label: "Total Bus Aktif",
      value: overviewQuery.data?.activeBuses ?? "—",
      description: "Jumlah armada bus yang sedang aktif.",
      icon: Wifi,
      href: "/admin/buses",
    },
    {
      label: "Total Bus Keseluruhan",
      value: overviewQuery.data?.buses ?? "—",
      description: "Total armada bus dalam sistem.",
      icon: Bus,
      href: "/admin/buses",
    },
    {
      label: "Total Kartu Aktif",
      value: overviewQuery.data?.activeCards ?? "—",
      description: "Jumlah kartu RFID yang saat ini aktif.",
      icon: CreditCard,
      href: "/admin/cards",
    },
    {
      label: "Total Kartu Keseluruhan",
      value: overviewQuery.data?.cards ?? "—",
      description: "Semua kartu RFID yang terdaftar.",
      icon: ReceiptText,
      href: "/admin/cards",
    },
    {
      label: "Total User",
      value: overviewQuery.data?.users ?? "—",
      description: "Jumlah pengguna yang terdaftar dalam sistem.",
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
        <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between rounded-3xl bg-gradient-to-br from-[#18181A]/80 to-[#2A2A2E]/80 backdrop-blur-xl border border-white/5 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 backdrop-blur-md mb-2">
              <Sparkles className="mr-1.5 h-3 w-3" />
              Buswy Admin Dashboard
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-5xl drop-shadow-md">
              Dashboard Operasional
            </h1>
            <p className="mt-4 max-w-2xl text-base text-zinc-300 font-medium leading-relaxed">
              Ringkasan data dan transaksi terakhir secara real-time.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <select
              aria-label="Filter bus"
              className="h-10 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white shadow-inner outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/50 backdrop-blur-md appearance-none"
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
              className="h-10 bg-white/10 text-white hover:bg-white/20 border border-white/10 backdrop-blur-md"
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
              <Button size="sm" className="h-10 bg-primary/80 hover:bg-primary text-primary-foreground backdrop-blur-md shadow-lg shadow-primary/20">Add new sensor</Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metricItems.map((metric) => {
            const Icon = metric.icon;
            const cardContent = (
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#18181A]/60 backdrop-blur-xl p-6 shadow-lg transition-all duration-300 hover:border-white/30 hover:bg-[#18181A]/80 hover:shadow-primary/20 hover:-translate-y-1">
                <div className="absolute -right-6 -top-6 rounded-full bg-primary/10 p-8 blur-2xl transition-all group-hover:bg-primary/20" />
                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-white drop-shadow-sm">
                      {metric.value}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-primary/40 text-white shadow-inner">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <p className="relative z-10 mt-5 text-sm text-muted-foreground/90 font-medium">
                  {metric.description}
                </p>
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
          <Card className="overflow-hidden border-white/10 bg-[#18181A]/60 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="text-white drop-shadow-sm">Profit Bus</CardTitle>
              <CardDescription className="text-zinc-400">
                Menampilkan profit harian, mingguan, dan bulanan untuk semua armada atau satu bus tertentu.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
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
                      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a1e]/60 p-6 shadow-md transition-all duration-300 hover:border-primary/30 hover:bg-[#1f1f24]/80 backdrop-blur-md"
                    >
                      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl transition-all group-hover:bg-emerald-500/10" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 relative z-10">
                        {item.label}
                      </p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-white drop-shadow-sm relative z-10">
                        {formatCurrency(item.value)}
                      </p>
                      <p className="mt-4 text-sm text-zinc-400 font-medium relative z-10">{item.description}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="overflow-hidden border-white/10 bg-[#18181A]/60 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="text-white drop-shadow-sm">5 Transaksi Terakhir Hari Ini</CardTitle>
              <CardDescription className="text-zinc-400">
                Menampilkan transaksi pengguna dari awal hari hingga sekarang.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
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
                        className="group relative block overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a1e]/40 p-5 transition-all duration-300 hover:border-primary/40 hover:bg-[#1a1a1e]/80 hover:shadow-lg hover:shadow-primary/5 backdrop-blur-sm"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-100%] transition-transform duration-700 group-hover:translate-x-[100%]" />
                        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div className={
                                item.type === "IN" 
                                  ? "flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"
                                  : item.type === "OUT"
                                  ? "flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400"
                                  : "flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-400"
                            }>
                                <ReceiptText className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-white text-base">
                                    {item.type === "IN" ? "Tap In" : item.type === "OUT" ? "Tap Out" : "Penalty"}
                                  </p>
                                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-zinc-300">
                                    {item.bus.busCode}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm font-medium text-zinc-400">
                                  {item.card.user?.name ?? item.card.rfidTag}
                                </p>
                            </div>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center mt-2 sm:mt-0 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                            <p className="text-lg font-bold text-white">
                              {formatCurrency(item.amount)}
                            </p>
                            <div className="flex flex-col sm:items-end items-start text-right mt-1">
                                <p className="text-xs font-medium text-zinc-500">
                                {new Intl.DateTimeFormat("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                }).format(new Date(item.createdAt))}
                                </p>
                                <p className="text-xs font-medium text-zinc-400 mt-0.5">
                                {item.stationName ?? "Lokasi tidak tersedia"}
                                </p>
                            </div>
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