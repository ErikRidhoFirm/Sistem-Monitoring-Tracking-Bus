import { useState } from "react";
import { AdminLayout } from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAdminTransactions,
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  TransactionItem,
} from "@/lib/hooks/use-admin-transactions";
import { TransactionTypeValue } from "@/types/transaction-type";
import { Search, Trash2, Plus, Calendar, MapPin, Bus, CreditCard, Eye, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionTypeValue | "ALL">("ALL");

  // Form states
  const [txType, setTxType] = useState<TransactionTypeValue>(TransactionTypeValue.IN);
  const [amount, setAmount] = useState("2500");
  const [rfidTag, setRfidTag] = useState("");
  const [busId, setBusId] = useState("");
  const [stationName, setStationName] = useState("");
  const [latTap, setLatTap] = useState("");
  const [lngTap, setLngTap] = useState("");

  // Detail modal state
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, isLoading, error } = useAdminTransactions(search, typeFilter);
  const createMutation = useCreateTransactionMutation();
  const deleteMutation = useDeleteTransactionMutation();

  const handleCreateTransaction = () => {
    if (!rfidTag) {
      toast.error("RFID Tag wajib dipilih");
      return;
    }
    if (!busId) {
      toast.error("Bus wajib dipilih");
      return;
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      toast.error("Jumlah harus berupa angka 0 atau lebih");
      return;
    }

    const parsedLat = latTap ? Number(latTap) : undefined;
    const parsedLng = lngTap ? Number(lngTap) : undefined;

    if (latTap && Number.isNaN(parsedLat)) {
      toast.error("Latitude harus berupa angka");
      return;
    }
    if (lngTap && Number.isNaN(parsedLng)) {
      toast.error("Longitude harus berupa angka");
      return;
    }

    createMutation.mutate(
      {
        type: txType,
        amount: parsedAmount,
        rfidTag,
        busId,
        stationName: stationName.trim() || undefined,
        latTap: parsedLat,
        lngTap: parsedLng,
      },
      {
        onSuccess: () => {
          toast.success("Transaksi manual berhasil dicatat");
          setAmount("2500");
          setRfidTag("");
          setBusId("");
          setStationName("");
          setLatTap("");
          setLngTap("");
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Gagal membuat transaksi");
        },
      },
    );
  };

  const handleDeleteTransaction = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini akan memulihkan saldo kartu dan status isInside jika memungkinkan.")) {
      return;
    }

    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Transaksi berhasil dihapus");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Gagal menghapus transaksi");
      },
    });
  };

  const transactions = data?.transactions ?? [];
  const cards = data?.cards ?? [];
  const buses = data?.buses ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Riwayat Transaksi</h1>
          <p className="text-sm text-muted-foreground">
            Pantau dan kelola seluruh transaksi tapping kartu RFID pengguna pada armada bus.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* List Section */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Daftar Transaksi</CardTitle>
              <CardDescription>
                Gunakan pencarian untuk menyaring RFID, nama stasiun, bus, atau pengguna.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                {/* Search */}
                <div className="flex flex-1 items-center gap-3 rounded-full border border-border bg-background px-3 py-2 shadow-sm">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari transaksi (RFID, stasiun, bus, user)..."
                    className="border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:outline-none"
                  />
                </div>

                {/* Filter Type */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm shadow-sm outline-none focus:border-primary"
                >
                  <option value="ALL">Semua Tipe</option>
                  <option value="IN">Tap In (IN)</option>
                  <option value="OUT">Tap Out (OUT)</option>
                  <option value="PENALTY">Denda (PENALTY)</option>
                </select>
              </div>

              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Memuat transaksi...</div>
              ) : error ? (
                <div className="py-6 text-center text-sm text-destructive">Gagal memuat transaksi.</div>
              ) : transactions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Tidak ada transaksi ditemukan.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        <th className="px-4 py-2">Info Tap</th>
                        <th className="px-4 py-2">Pengguna & RFID</th>
                        <th className="px-4 py-2">Bus & Stasiun</th>
                        <th className="px-4 py-2">Biaya</th>
                        <th className="px-4 py-2 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="rounded-2xl border border-border bg-card shadow-xs transition-colors hover:bg-muted/10">
                          {/* Info Tap */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span
                                className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  tx.type === TransactionTypeValue.IN
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : tx.type === TransactionTypeValue.OUT
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                }`}
                              >
                                {tx.type}
                              </span>
                              <span className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Intl.DateTimeFormat("id-ID", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                }).format(new Date(tx.createdAt))}
                              </span>
                            </div>
                          </td>

                          {/* Pengguna & RFID */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {tx.card.user?.name ?? "Tanpa Nama"}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {tx.rfidTag}
                              </span>
                            </div>
                          </td>

                          {/* Bus & Stasiun */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground flex items-center gap-1">
                                <Bus className="h-3.5 w-3.5 text-muted-foreground" />
                                {tx.bus.busCode} ({tx.bus.plateNumber})
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {tx.stationName || "-"}
                                {tx.latTap && tx.lngTap ? (
                                  <span className="text-[10px] text-muted-foreground/60">
                                    ({tx.latTap.toFixed(4)}, {tx.lngTap.toFixed(4)})
                                  </span>
                                ) : null}
                              </span>
                            </div>
                          </td>

                          {/* Biaya */}
                          <td className="px-4 py-3">
                            <span className="font-semibold text-foreground">
                              Rp {tx.amount.toLocaleString("id-ID")}
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground hover:bg-muted"
                                onClick={() => {
                                  setSelectedTx(tx);
                                  setIsDetailOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteTransaction(tx.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Section */}
          <Card className="border-border self-start">
            <CardHeader>
              <CardTitle>Catat Transaksi Manual</CardTitle>
              <CardDescription>
                Simulasikan atau buat entri transaksi baru langsung ke database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="txType">Tipe Transaksi</Label>
                <select
                  id="txType"
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as TransactionTypeValue)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus:border-primary"
                >
                  <option value={TransactionTypeValue.IN}>Tap In (Masuk)</option>
                  <option value={TransactionTypeValue.OUT}>Tap Out (Keluar)</option>
                  <option value={TransactionTypeValue.PENALTY}>Penalty (Denda)</option>
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah Biaya (Rp)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="2500"
                />
              </div>

              {/* Card Selection */}
              <div className="space-y-2">
                <Label htmlFor="rfidSelect">Pilih RFID / Kartu</Label>
                <select
                  id="rfidSelect"
                  value={rfidTag}
                  onChange={(e) => setRfidTag(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus:border-primary"
                >
                  <option value="">-- Pilih Kartu RFID --</option>
                  {cards.map((card) => (
                    <option key={card.rfidTag} value={card.rfidTag}>
                      {card.rfidTag}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bus Selection */}
              <div className="space-y-2">
                <Label htmlFor="busSelect">Pilih Bus</Label>
                <select
                  id="busSelect"
                  value={busId}
                  onChange={(e) => setBusId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus:border-primary"
                >
                  <option value="">-- Pilih Bus --</option>
                  {buses.map((bus) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.busCode} ({bus.plateNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Station Name */}
              <div className="space-y-2">
                <Label htmlFor="stationName">Nama Stasiun / Halte (opsional)</Label>
                <Input
                  id="stationName"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  placeholder="Contoh: Halte Menur"
                />
              </div>

              {/* Lat & Lng */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="latTap">Latitude (opsional)</Label>
                  <Input
                    id="latTap"
                    value={latTap}
                    onChange={(e) => setLatTap(e.target.value)}
                    placeholder="-7.1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lngTap">Longitude (opsional)</Label>
                  <Input
                    id="lngTap"
                    value={lngTap}
                    onChange={(e) => setLngTap(e.target.value)}
                    placeholder="112.5678"
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateTransaction}
                className="w-full"
                disabled={createMutation.isPending}
              >
                <Plus className="mr-2 h-4 w-4" /> Catat Transaksi
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-xl rounded-3xl border border-border bg-card">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
            <DialogDescription>
              Rincian data transaksi tap kartu RFID.
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-6 py-2">
              {/* Receipt styling */}
              <div className="rounded-2xl bg-muted/30 p-4 border border-border/50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">ID Transaksi</span>
                    <p className="font-mono text-sm font-semibold text-foreground select-all mt-0.5">{selectedTx.id}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedTx.type === TransactionTypeValue.IN
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : selectedTx.type === TransactionTypeValue.OUT
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {selectedTx.type === TransactionTypeValue.IN
                      ? "Tap In (IN)"
                      : selectedTx.type === TransactionTypeValue.OUT
                      ? "Tap Out (OUT)"
                      : "Denda (PENALTY)"}
                  </span>
                </div>

                <div className="mt-4 border-t border-border/50 pt-4 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Waktu Tap</span>
                    <p className="text-sm font-medium mt-0.5">
                      {new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "long",
                        timeStyle: "medium",
                      }).format(new Date(selectedTx.createdAt))}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Biaya / Tarif</span>
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      Rp {selectedTx.amount.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid of details */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* RFID and User Card */}
                <div className="space-y-1 p-3.5 rounded-xl border border-border bg-card shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                    <CreditCard className="h-3.5 w-3.5" />
                    Kartu & Pengguna
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">RFID Tag</span>
                    <p className="text-sm font-mono font-medium">{selectedTx.rfidTag}</p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-border/40">
                    <span className="text-[10px] text-muted-foreground">Nama Pengguna</span>
                    <p className="text-sm font-medium text-foreground">{selectedTx.card.user?.name ?? "Tanpa Nama"}</p>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] text-muted-foreground">Email</span>
                    <p className="text-sm text-muted-foreground truncate">{selectedTx.card.user?.email ?? "Tidak ada email"}</p>
                  </div>
                </div>

                {/* Bus and Station */}
                <div className="space-y-1 p-3.5 rounded-xl border border-border bg-card shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                    <Bus className="h-3.5 w-3.5" />
                    Armada & Lokasi
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Kode Bus</span>
                    <p className="text-sm font-medium text-foreground">{selectedTx.bus.busCode}</p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-border/40">
                    <span className="text-[10px] text-muted-foreground">Nomor Polisi</span>
                    <p className="text-sm font-medium text-foreground">{selectedTx.bus.plateNumber}</p>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] text-muted-foreground">Halte / Stasiun</span>
                    <p className="text-sm text-foreground font-medium truncate">{selectedTx.stationName || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Coordinates / Map Pin */}
              <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  <MapPin className="h-3.5 w-3.5" />
                  Koordinat Lokasi Tap
                </div>
                {selectedTx.latTap && selectedTx.lngTap ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {selectedTx.latTap.toFixed(6)}, {selectedTx.lngTap.toFixed(6)}
                      </p>
                      <p className="text-xs text-muted-foreground">Latitude, Longitude</p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedTx.latTap},${selectedTx.lngTap}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary px-3.5 py-2 text-xs font-semibold transition"
                    >
                      Buka Google Maps <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground pt-1">Koordinat GPS tidak tersedia pada transaksi ini.</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
