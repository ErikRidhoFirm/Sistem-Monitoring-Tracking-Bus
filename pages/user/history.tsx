import { useState } from "react";
import { UserLayout } from "@/components/user/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useUserTransactions } from "@/lib/hooks/use-user-transactions";
import { TransactionTypeValue } from "@/types/transaction-type";
import { Calendar, CreditCard, MapPin, Bus } from "lucide-react";

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
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionTypeValue | "ALL">("ALL");

  const { data, isLoading, error } = useUserTransactions(search, typeFilter);
  const transactions = data?.transactions ?? [];
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
              <CardDescription>
                Cari berdasarkan RFID, nama stasiun, nomor bus, atau filter berdasarkan tipe transaksi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-full border border-border bg-background px-3 py-2 shadow-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari transaksi..."
                    className="border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:outline-none"
                  />
                </div>
                <div className="w-full sm:w-56">
                  <Label htmlFor="typeFilter" className="sr-only">
                    Filter Tipe Transaksi
                  </Label>
                  <select
                    id="typeFilter"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as TransactionTypeValue | "ALL")}
                    className="flex h-10 w-full rounded-full border border-border bg-background px-4 py-2 text-sm shadow-sm outline-none focus:border-primary"
                  >
                    <option value="ALL">Semua Tipe</option>
                    <option value="IN">Tap In (Masuk)</option>
                    <option value="OUT">Tap Out (Keluar)</option>
                    <option value="PENALTY">Denda (Penalty)</option>
                  </select>
                </div>
              </div>

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
