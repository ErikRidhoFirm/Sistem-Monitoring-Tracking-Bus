import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SelectMenu from "@/components/ui/select-menu";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/line-chart";
import { CreditCard, Sparkles, Users, Wifi } from "lucide-react";
import { useAdminBuses } from "@/lib/hooks/use-admin-buses";
import { useAdminOverviewByBus } from "@/lib/hooks/use-admin-overview";
import { useAdminProfitTrend } from "@/lib/hooks/use-admin-profit-trend";
import { useAdminProfitSummary } from "@/lib/hooks/use-admin-profit-summary";
import { useAdminTodayTransactionsByBus } from "@/lib/hooks/use-admin-today-transactions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const dashboardSurfaceClassName =
  "rounded-3xl border border-border/50 bg-card/80 shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-sm transform-gpu transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border/60 hover:bg-card/90 hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)]";

const dashboardSoftCardClassName =
  "rounded-3xl border border-border/40 bg-background/80 shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-sm transform-gpu transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border/55 hover:bg-background/90 hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)]";

const chartPanelClassName =
  "rounded-3xl border border-white/15 bg-[#17355a] text-[#f4f1e8] shadow-[0_12px_34px_rgba(15,23,42,0.06)] transform-gpu transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#214d79] hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)]";

const chartPanelStaticClassName =
  "rounded-3xl border border-white/15 bg-[#17355a] text-[#f4f1e8] shadow-[0_12px_34px_rgba(15,23,42,0.06)] transform-gpu";

const profitSummarySectionClassName =
  "rounded-3xl border border-white/15 bg-[#17355a] shadow-[0_18px_50px_rgba(36,91,176,0.12)] transform-gpu hover:-translate-y-0.5 hover:shadow-[0_22px_64px_rgba(36,91,176,0.14)] transition-all duration-200 ease-out";



export default function AdminPage() {
  const [selectedBusId, setSelectedBusId] = useState<string | "ALL">("ALL");
  const [selectedProfitRange, setSelectedProfitRange] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const overviewQuery = useAdminOverviewByBus(selectedBusId);
  const busesQuery = useAdminBuses("");
  const profitQuery = useAdminProfitSummary(selectedBusId);
  const profitTrendQuery = useAdminProfitTrend(selectedBusId, selectedProfitRange);
  const transactionsQuery = useAdminTodayTransactionsByBus(5, selectedBusId);
  const todayTrendQuery = useAdminTodayTransactionsByBus(20, selectedBusId);

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

  const trendChartConfig = {
    transactions: {
      label: "Transaksi",
      color: "#2563eb",
    },
    profit: {
      label: "Profit",
      color: "#f97316",
    },
  } satisfies ChartConfig;

  const profitChartConfig = {
    profit: {
      label: "Profit",
      color: "#f97316",
    },
  } satisfies ChartConfig;

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

  const trendChartData = useMemo(() => {
    const hourBuckets = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      transactions: 0,
      profit: 0,
    }));

    for (const transaction of todayTrendQuery.data?.transactions ?? []) {
      const createdAt = new Date(transaction.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        continue;
      }

      const hour = createdAt.getHours();
      hourBuckets[hour].transactions += 1;
      hourBuckets[hour].profit += transaction.amount;
    }

    return hourBuckets;
  }, [todayTrendQuery.data?.transactions]);

  const selectedProfitRangeLabel =
    selectedProfitRange === "weekly"
      ? "Profit Mingguan"
      : selectedProfitRange === "monthly"
        ? "Profit Bulanan"
        : "Profit Tahunan";

  const selectedProfitRangeDescription =
    selectedProfitRange === "weekly"
      ? "Akumulasi transaksi sejak awal minggu."
      : selectedProfitRange === "monthly"
        ? "Akumulasi transaksi sejak awal bulan."
        : "Akumulasi transaksi sejak awal tahun.";

  const todayProfitChartData = trendChartData.map((item) => ({
    label: item.hour,
    profit: item.profit,
  }));

  const selectedRangeProfitChartData = profitTrendQuery.data?.points ?? [];
  const selectedRangeProfitTotal = selectedRangeProfitChartData.reduce(
    (sum, point) => sum + point.profit,
    0,
  );

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
                profitTrendQuery.refetch();
                transactionsQuery.refetch();
                todayTrendQuery.refetch();
              }}
              disabled={
                overviewQuery.isFetching ||
                busesQuery.isFetching ||
                profitQuery.isFetching ||
                profitTrendQuery.isFetching ||
                transactionsQuery.isFetching ||
                todayTrendQuery.isFetching
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
          <Card className={profitSummarySectionClassName + " static-card"}>
            <CardHeader>
              <CardTitle className="text-[#f4f1e8]">Ringkasan Profit</CardTitle>
              <CardDescription className="text-[#f4f1e8]/80">
                Dua chart profit: kiri untuk hari ini, kanan untuk periode yang dipilih.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex h-full flex-col p-5 pt-0">
              {!profitQuery.isLoading && !profitQuery.isError ? (
                <div className="grid flex-1 gap-4 lg:grid-cols-2">
                  <Card className={chartPanelStaticClassName + " static-card flex h-full flex-col p-5"}>
                    <div className="mb-4 flex flex-none flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#f4f1e8]/80">
                          Chart Profit Hari Ini
                        </p>
                        <p className="mt-1 text-sm text-[#f4f1e8]/75">Akumulasi per jam.</p>
                      </div>
                      <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f4f1e8]/80">
                          Total Today
                        </p>
                        <p className="mt-1 text-2xl font-semibold leading-none tracking-tight text-[#f4f1e8] sm:text-3xl">
                          {formatCurrency(profitQuery.data?.dailyProfit)}
                        </p>
                      </div>
                    </div>
                    <ChartContainer
                      config={profitChartConfig}
                      className="min-h-[320px] flex-1 aspect-auto w-full [&_.recharts-cartesian-axis-tick_text]:fill-[#f4f1e8] [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-white/20"
                    >
                      <LineChart data={todayProfitChartData} margin={{ left: 4, right: 8, top: 4, bottom: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={3} tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 700, opacity: 1 }} />
                        <YAxis tickLine={false} axisLine={false} width={56} tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 700, opacity: 1 }} />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              className="bg-[#0b1b36]/95 border border-white/15 text-[#f4f1e8] shadow-[0_12px_36px_rgba(0,0,0,0.3)] backdrop-blur-md [&_.text-muted-foreground]:text-white/60 [&_.text-foreground]:text-[#f4f1e8]"
                              formatter={(value: number | string) => formatCurrency(Number(value))}
                            />
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="profit"
                          stroke="var(--color-profit)"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  </Card>

                  <Card className={chartPanelStaticClassName + " static-card flex h-full flex-col p-5"}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#f4f1e8]/80">
                        Chart Profit Rentang
                      </p>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1">
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedProfitRange === "weekly" ? "default" : "ghost"}
                          className={`rounded-full ${selectedProfitRange === "weekly" ? "bg-[linear-gradient(135deg,#ff9a4df2_0%,#ff7a2fd9_100%)] text-white shadow-[0_10px_24px_rgba(255,122,47,0.28)] hover:opacity-95" : "text-[#f4f1e8]/90 hover:bg-white/15 hover:text-[#f4f1e8]"}`}
                          onClick={() => setSelectedProfitRange("weekly")}
                        >
                          Mingguan
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedProfitRange === "monthly" ? "default" : "ghost"}
                          className={`rounded-full ${selectedProfitRange === "monthly" ? "bg-[linear-gradient(135deg,#ff9a4df2_0%,#ff7a2fd9_100%)] text-white shadow-[0_10px_24px_rgba(255,122,47,0.28)] hover:opacity-95" : "text-[#f4f1e8]/90 hover:bg-white/15 hover:text-[#f4f1e8]"}`}
                          onClick={() => setSelectedProfitRange("monthly")}
                        >
                          Bulanan
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedProfitRange === "yearly" ? "default" : "ghost"}
                          className={`rounded-full ${selectedProfitRange === "yearly" ? "bg-[linear-gradient(135deg,#ff9a4df2_0%,#ff7a2fd9_100%)] text-white shadow-[0_10px_24px_rgba(255,122,47,0.28)] hover:opacity-95" : "text-[#f4f1e8]/90 hover:bg-white/15 hover:text-[#f4f1e8]"}`}
                          onClick={() => setSelectedProfitRange("yearly")}
                        >
                          Tahunan
                        </Button>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-medium uppercase tracking-[0.24em] text-[#f4f1e8]/80">
                      {selectedProfitRangeLabel}
                    </p>
                    {profitTrendQuery.isLoading ? (
                      <p className="mt-3 text-sm text-[#f4f1e8]/75">Memuat data chart rentang...</p>
                    ) : null}
                    {profitTrendQuery.isError ? (
                      <p className="mt-3 text-sm text-destructive">
                        {profitTrendQuery.error instanceof Error
                          ? profitTrendQuery.error.message
                          : "Gagal memuat chart rentang profit."}
                      </p>
                    ) : null}
                    {!profitTrendQuery.isLoading && !profitTrendQuery.isError ? (
                      <ChartContainer
                        config={profitChartConfig}
                        className="mt-3 h-[220px] w-full [&_.recharts-cartesian-axis-tick_text]:fill-[#f4f1e8] [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-white/20"
                      >
                        <LineChart data={selectedRangeProfitChartData} margin={{ left: 4, right: 8, top: 4, bottom: 0 }}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 700, opacity: 1 }} />
                          <YAxis tickLine={false} axisLine={false} width={56} tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 700, opacity: 1 }} />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                className="bg-[#0b1b36]/95 border border-white/15 text-[#f4f1e8] shadow-[0_12px_36px_rgba(0,0,0,0.3)] backdrop-blur-md [&_.text-muted-foreground]:text-white/60 [&_.text-foreground]:text-[#f4f1e8]"
                                formatter={(value: number | string) => formatCurrency(Number(value))}
                              />
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="profit"
                            stroke="var(--color-profit)"
                            strokeWidth={2.5}
                            dot
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : null}
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#f4f1e8]/80">
                      Total {selectedProfitRangeLabel.replace("Profit ", "")}
                    </p>
                    <p className="mt-1 text-4xl font-semibold tracking-tight text-[#f4f1e8] sm:text-5xl">
                      {formatCurrency(selectedRangeProfitTotal)}
                    </p>
                    <p className="mt-3 text-sm text-[#f4f1e8]/75">{selectedProfitRangeDescription}</p>
                  </Card>
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