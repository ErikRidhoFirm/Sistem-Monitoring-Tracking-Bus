import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AdminLayout } from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAdminTransactions,
  TransactionItem,
} from "@/lib/hooks/use-admin-transactions";
import { TransactionTypeValue } from "@/types/transaction-type";
import { Search, Calendar, MapPin, Bus, CreditCard, Eye, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AdminPageHeader } from "@/components/admin/page-header";

type UserGroup = {
  rfidTag: string;
  userName: string;
  userEmail: string;
  latestTx: TransactionItem;
  txList: TransactionItem[];
};

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState("");
  const [userLinkFilter, setUserLinkFilter] = useState<"ALL" | "LINKED" | "UNLINKED">("ALL");

  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  // Detail modal state
  const [selectedUserGroup, setSelectedUserGroup] = useState<UserGroup | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Pagination states (URL Query Param-Based)
  const router = useRouter();
  const queryPage = router.query.page;
  const currentPage = router.isReady && typeof queryPage === "string" ? parseInt(queryPage, 10) || 1 : 1;
  const itemsPerPage = 10;

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

  // Synchronize URL to always have ?page=1 on initial load if missing
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

  const { data, isLoading, error } = useAdminTransactions(
    search,
    "ALL",
    currentPage,
    itemsPerPage,
    userLinkFilter,
    startDate || undefined,
    endDate || undefined
  );

  const uniqueUsersList = data?.users ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = uniqueUsersList;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Transaction Log"
          title="Riwayat Transaksi"
          description="Pantau dan kelola seluruh transaksi tapping kartu RFID pengguna pada armada bus."
        />

        {/* MAIN FULL-WIDTH CONTAINER */}
        <div className="w-full">
          <Card className="border-border">
            <CardHeader className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div>
                <CardTitle>Daftar Pengguna Aktif</CardTitle>

              </div>

              {/* SEARCH & FILTERS */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full xl:w-auto flex-wrap">
                {/* Search */}
                <div className="flex items-center gap-3 rounded-full border border-border bg-background px-3 py-2 shadow-sm w-full sm:w-60">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Cari pengguna atau RFID..."
                    className="border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:outline-none w-full"
                  />
                </div>

                {/* Status Hubung Kartu Select Dropdown */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={userLinkFilter}
                    onChange={(e) => {
                      setUserLinkFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="rounded-full shadow-sm text-xs font-semibold h-[38px] px-4 w-full sm:w-auto border border-border bg-background hover:bg-muted/30 text-foreground cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="ALL">Semua Kartu</option>
                    <option value="LINKED">Terhubung Pengguna</option>
                    <option value="UNLINKED">Belum Terhubung</option>
                  </select>
                </div>

                {/* Date range filters Dropdown */}
                <div className="relative w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                    className="rounded-full shadow-sm text-xs font-semibold gap-1.5 h-[38px] px-4 w-full sm:w-auto border-border bg-background hover:bg-muted/30"
                  >
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {startDate || endDate ? (
                      <span className="text-primary font-bold">
                        {startDate && !endDate && `Mulai: ${startDate}`}
                        {!startDate && endDate && `Selesai: ${endDate}`}
                        {startDate && endDate && `${startDate} s/d ${endDate}`}
                      </span>
                    ) : (
                      "Filter Tanggal"
                    )}
                  </Button>

                  {isDateDropdownOpen && (
                    <>
                      {/* Close dropdown on click outside */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsDateDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-border bg-card p-4 shadow-lg z-20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-100">
                        <div className="space-y-1.5">
                          <Label htmlFor="popover-start-date" className="text-xs font-semibold text-muted-foreground">
                            Tanggal Mulai
                          </Label>
                          <Input
                            id="popover-start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                              setStartDate(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="text-xs w-full"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="popover-end-date" className="text-xs font-semibold text-muted-foreground">
                            Tanggal Selesai
                          </Label>
                          <Input
                            id="popover-end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                              setEndDate(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="text-xs w-full"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/80">
                          <button
                            type="button"
                            onClick={() => {
                              setStartDate("");
                              setEndDate("");
                              setCurrentPage(1);
                              setIsDateDropdownOpen(false);
                            }}
                            className="text-xs text-destructive hover:underline font-semibold disabled:opacity-50 disabled:hover:no-underline"
                            disabled={!startDate && !endDate}
                          >
                            Reset Filter
                          </button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setIsDateDropdownOpen(false)}
                            className="text-xs px-3.5"
                          >
                            Tutup
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Memuat transaksi...</div>
              ) : error ? (
                <div className="py-12 text-center text-sm text-destructive">Gagal memuat transaksi.</div>
              ) : uniqueUsersList.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Tidak ada pengguna ditemukan.</div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full border-separate border-spacing-y-3 text-left text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                          <th className="px-4 py-2">Tanggal Terakhir</th>
                          <th className="px-4 py-2">Pengguna & RFID</th>
                          <th className="px-4 py-2">Bus & Stasiun Terakhir</th>
                          <th className="px-4 py-2 text-right">Detail Riwayat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.map((user) => (
                          <tr key={user.rfidTag} className="rounded-2xl border border-border bg-card shadow-xs transition-colors hover:bg-muted/10">
                            {/* Tanggal Terakhir */}
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {new Intl.DateTimeFormat("id-ID", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }).format(new Date(user.latestTx.createdAt))}
                              </span>
                            </td>

                            {/* Pengguna & RFID */}
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">
                                  {user.userName}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CreditCard className="h-3 w-3" />
                                  {user.rfidTag}
                                </span>
                              </div>
                            </td>

                            {/* Bus & Stasiun Terakhir */}
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground flex items-center gap-1">
                                  <Bus className="h-3.5 w-3.5 text-muted-foreground" />
                                  {user.latestTx.bus.busCode} ({user.latestTx.bus.plateNumber})
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {user.latestTx.stationName || "-"}
                                </span>
                              </div>
                            </td>

                            {/* Aksi */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-muted-foreground hover:bg-muted"
                                  onClick={() => {
                                    setSelectedUserGroup(user);
                                    setIsDetailOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINATION CONTROLS */}
                  {totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4 px-2">
                      <div className="text-xs text-muted-foreground">
                        Menampilkan <span className="font-semibold text-foreground">{totalItems === 0 ? 0 : startIndex + 1}</span> -{" "}
                        <span className="font-semibold text-foreground">
                          {Math.min(endIndex, totalItems)}
                        </span>{" "}
                        dari <span className="font-semibold text-foreground">{totalItems}</span> pengguna
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1 || totalPages <= 1}
                        >
                          <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Sebelumnya
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {totalPages > 0 ? (
                            Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 2 && page <= currentPage + 2)
                              ) {
                                return (
                                  <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="icon-sm"
                                    className="h-8 w-8 text-xs rounded-lg font-medium"
                                    onClick={() => setCurrentPage(page)}
                                  >
                                    {page}
                                  </Button>
                                );
                              }
                              if (page === currentPage - 3 || page === currentPage + 3) {
                                return (
                                  <span key={page} className="text-muted-foreground px-1 text-xs select-none">
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            })
                          ) : (
                            <Button
                              variant="default"
                              size="icon-sm"
                              className="h-8 w-8 text-xs rounded-lg font-medium"
                              disabled
                            >
                              1
                            </Button>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages || totalPages <= 1}
                        >
                          Berikutnya <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-xl rounded-3xl border border-border bg-card">
          <DialogHeader>
            <DialogTitle>Detail Riwayat Pengguna</DialogTitle>
            <DialogDescription>
              Rincian seluruh transaksi Tap In & Tap Out untuk pengguna ini.
            </DialogDescription>
          </DialogHeader>

          {selectedUserGroup && (
            <div className="space-y-6 py-2">
              {/* User Info Card */}
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-muted/30 border border-border/60">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                  {selectedUserGroup.userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-foreground truncate">{selectedUserGroup.userName}</h4>
                  <p className="text-xs text-muted-foreground truncate">{selectedUserGroup.userEmail}</p>
                  <p className="text-[10px] font-mono text-muted-foreground/80 mt-0.5">RFID: {selectedUserGroup.rfidTag}</p>
                </div>
              </div>

              {/* Timeline list of tapping events */}
              <div className="space-y-4">
                <h5 className="text-sm font-semibold text-foreground">
                  Daftar Perjalanan ({selectedUserGroup.txList.length})
                </h5>

                <div className="max-h-[350px] overflow-y-auto pr-1 space-y-4 scrollbar-thin">
                  {selectedUserGroup.txList.map((tx) => (
                    <div key={tx.id} className="relative pl-6 border-l-2 border-border/80 last:border-l-0 pb-1">
                      {/* Timeline Indicator Dot */}
                      <span className={`absolute left-[-6.5px] top-2 w-3 h-3 rounded-full border-2 border-card ${
                        tx.type === TransactionTypeValue.IN
                          ? "bg-emerald-500"
                          : tx.type === TransactionTypeValue.OUT
                          ? "bg-blue-500"
                          : "bg-red-500"
                      }`} />

                      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3 transition-colors hover:border-border/100">
                        {/* Event Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              tx.type === TransactionTypeValue.IN
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : tx.type === TransactionTypeValue.OUT
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            }`}>
                              {tx.type === TransactionTypeValue.IN
                                ? "Tap In (Masuk)"
                                : tx.type === TransactionTypeValue.OUT
                                ? "Tap Out (Keluar)"
                                : "Denda (Penalty)"}
                            </span>
                            
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground/80" />
                              {new Intl.DateTimeFormat("id-ID", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(new Date(tx.createdAt))}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Tarif</span>
                            <span className="text-sm font-bold text-foreground">
                              Rp {tx.amount.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>

                        {/* Event Grid Details */}
                        <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/50 pt-3">
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Bus</span>
                            <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                              <Bus className="h-3.5 w-3.5 text-muted-foreground/75" />
                              {tx.bus.busCode} ({tx.bus.plateNumber})
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Stasiun</span>
                            <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5 truncate block">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground/75" />
                              {tx.stationName || "-"}
                            </span>
                          </div>
                        </div>

                        {/* GPS Coordinates link */}
                        {tx.latTap && tx.lngTap && (
                          <div className="flex items-center justify-between text-xs pt-2.5 border-t border-border/30">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              GPS: {tx.latTap.toFixed(6)}, {tx.lngTap.toFixed(6)}
                            </span>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${tx.latTap},${tx.lngTap}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-semibold"
                            >
                              Buka Google Maps <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
