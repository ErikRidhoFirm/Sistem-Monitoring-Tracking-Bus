import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { UserLayout } from "@/components/user/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useUserTransactions } from "@/lib/hooks/use-user-transactions";
import { TransactionTypeValue } from "@/types/transaction-type";
import { CreditCard, MapPin, Bus, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const formatLongDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "medium",
  });

type UserTransactionItem = {
  id: string;
  type: TransactionTypeValue;
  amount: number;
  latTap: number | null;
  lngTap: number | null;
  createdAt: string;
  stationName: string | null;
  rfidTag: string;
  bus: {
    busCode: string;
    plateNumber: string;
  };
};

export default function UserHistoryPage() {
  const router = useRouter();
  const queryPage = router.query.page;
  const currentPage = router.isReady
    ? typeof queryPage === "string"
      ? parseInt(queryPage, 10) || 1
      : Array.isArray(queryPage)
      ? parseInt(queryPage[0], 10) || 1
      : 1
    : 1;
  const itemsPerPage = 10;

  useEffect(() => {
    if (router.isReady && !router.query.page) {
      router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, page: "1" },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [router.isReady, router.query.page]);

  const setCurrentPage = (value: number | ((prev: number) => number)) => {
    const nextPage = typeof value === "function" ? value(currentPage) : value;
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, page: nextPage.toString() },
      },
      undefined,
      { shallow: true }
    );
  };

  const { data, isLoading, error } = useUserTransactions("", "ALL", currentPage, itemsPerPage);
  const transactions = data?.transactions ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const latestTransaction = transactions[0] ?? null;

  return (
    <UserLayout>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Riwayat Transaksi"
          title="Riwayat Transaksi"
          description="Lihat semua transaksi kartu RFID Anda, termasuk jam tapping, bus, dan detail stasiun."
        />

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Daftar Transaksi Anda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Memuat transaksi...</div>
              ) : error ? (
                <div className="py-6 text-center text-sm text-destructive">Gagal memuat transaksi.</div>
              ) : transactions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Belum ada riwayat transaksi.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[600px] w-full border-separate border-spacing-y-3 text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        <th className="px-4 py-2">Info Tap</th>
                        <th className="px-4 py-2">Bus & Stasiun</th>
                        <th className="px-4 py-2">Biaya</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="rounded-2xl border border-border bg-card shadow-xs transition-colors hover:bg-muted/10">
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2">
                              <span
                                className={`inline-flex w-fit rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                                  tx.type === TransactionTypeValue.IN
                                    ? "bg-emerald-100 text-emerald-800"
                                    : tx.type === TransactionTypeValue.OUT
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {tx.type}
                              </span>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDateTime(tx.createdAt)}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <CreditCard className="h-3.5 w-3.5" />
                                {tx.rfidTag}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-foreground flex items-center gap-1">
                                <Bus className="h-3.5 w-3.5 text-muted-foreground" />
                                {tx.bus.busCode} ({tx.bus.plateNumber})
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5" />
                                {tx.stationName ?? "-"}
                              </span>
                              {tx.latTap != null && tx.lngTap != null ? (
                                <span className="text-[11px] text-muted-foreground">
                                  {tx.latTap.toFixed(4)}, {tx.lngTap.toFixed(4)}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-foreground">{formatCurrency(tx.amount)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      Menampilkan {transactions.length} dari {totalItems} transaksi.
                    </p>
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Sebelumnya
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Halaman {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Selanjutnya
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border self-start">
            <CardHeader>
              <CardTitle>Ringkasan Transaksi</CardTitle>
              <CardDescription>Statistik singkat berdasarkan riwayat transaksi Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-3xl border border-border bg-background p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Total Transaksi</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{transactions.length}</p>
              </div>
              <div className="rounded-3xl border border-border bg-background p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Jumlah Biaya</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="rounded-3xl border border-border bg-background p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Terakhir Dipakai</p>
                <p className="mt-3 text-base font-semibold text-foreground">
                  {latestTransaction ? formatLongDateTime(latestTransaction.createdAt) : "Belum ada transaksi"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </UserLayout>
  );
}
