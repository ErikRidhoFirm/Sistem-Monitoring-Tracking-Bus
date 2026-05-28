import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminCards, useCreateCardMutation, useDeleteCardMutation } from "@/lib/hooks/use-admin-cards";
import { Search, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useRouter } from "next/router";

export default function CardManager() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [rfidTag, setRfidTag] = useState("");
  const [balance, setBalance] = useState("0");
  const [status, setStatus] = useState("active");
  const [userId, setUserId] = useState("");
  const [lastBusId, setLastBusId] = useState("");

  // Pagination states
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

  const { data, isLoading, error } = useAdminCards(search, currentPage, itemsPerPage);
  const createCardMutation = useCreateCardMutation();
  const deleteCardMutation = useDeleteCardMutation();

  const handleCreateCard = async () => {
    if (!rfidTag.trim()) {
      toast.error("RFID Tag wajib diisi");
      return;
    }

    const parsedBalance = Number(balance);

    if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
      toast.error("Saldo harus berupa angka nol atau lebih");
      return;
    }

    createCardMutation.mutate(
      {
        rfidTag: rfidTag.trim(),
        balance: parsedBalance,
        isInside: false,
        status: status.trim() || "active",
        userId: userId.trim() || null,
        lastBusId: lastBusId.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Kartu RFID berhasil ditambahkan");
          setRfidTag("");
          setBalance("0");
          setStatus("active");
          setUserId("");
          setLastBusId("");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Gagal membuat kartu RFID");
        },
      },
    );
  };

  const handleDeleteCard = (rfidTagToDelete: string) => {
    deleteCardMutation.mutate(rfidTagToDelete, {
      onSuccess: () => {
        toast.success("Kartu RFID dihapus");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Gagal menghapus kartu RFID");
      },
    });
  };

  const cards = data?.cards ?? [];
  const users = data?.users ?? [];
  const buses = data?.buses ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="RFID Center"
        title="Kelola Kartu RFID"
        description="Tambahkan, cari, dan pantau kartu RFID yang terdaftar dalam sistem."
      />

      <section className="space-y-3">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Daftar Kartu RFID</CardTitle>
              <CardDescription>Cari berdasarkan tag, nama pengguna, atau nomor bus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-full border border-border bg-background px-3 py-2 shadow-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari kartu RFID"
                  className="border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
                />
              </div>

              {isLoading ? (
                <div className="text-sm text-muted-foreground">Memuat data kartu...</div>
              ) : error ? (
                <div className="text-sm text-destructive">Gagal memuat kartu RFID.</div>
              ) : cards.length === 0 ? (
                <div className="text-sm text-muted-foreground">Belum ada kartu RFID terdaftar.</div>
              ) : (
                <>
                  <div className="w-full overflow-x-auto">
                    <table className="w-full border-separate border-spacing-y-3 text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                          <th className="px-4 py-3">Tag</th>
                          <th className="px-4 py-3">Saldo</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Bus Terakhir</th>
                          <th className="px-4 py-3">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cards.map((card) => (
                          <tr key={card.rfidTag} className="rounded-[18px] border border-border bg-card shadow-sm">
                            <td className="px-4 py-4 font-medium text-foreground">{card.rfidTag}</td>
                            <td className="px-4 py-4 text-muted-foreground">Rp {card.balance.toLocaleString("id-ID")}</td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                  card.status === "active"
                                    ? "bg-emerald-100 text-emerald-900"
                                    : "bg-slate-100 text-slate-900"
                                }`}
                              >
                                {card.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-muted-foreground">
                              {card.user?.name ?? card.user?.email ?? "-"}
                            </td>
                            <td className="px-4 py-4 text-muted-foreground">
                              {card.lastBus ? `${card.lastBus.busCode} (${card.lastBus.plateNumber})` : "-"}
                            </td>
                            <td className="px-4 py-4">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteCard(card.rfidTag)}
                                disabled={deleteCardMutation.isPending}
                              >
                                <Trash2 className="mr-2" /> Hapus
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINATION CONTROLS */}
                  {totalItems > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 pt-5">
                      <div className="text-xs text-muted-foreground">
                        Menampilkan <span className="font-semibold text-foreground">{totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> -{" "}
                        <span className="font-semibold text-foreground">
                          {Math.min(currentPage * itemsPerPage, totalItems)}
                        </span>{" "}
                        dari <span className="font-semibold text-foreground">{totalItems}</span> kartu RFID
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
                            Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                              if (
                                p === 1 ||
                                p === totalPages ||
                                (p >= currentPage - 2 && p <= currentPage + 2)
                              ) {
                                return (
                                  <Button
                                    key={p}
                                    variant={currentPage === p ? "default" : "outline"}
                                    size="sm"
                                    className="h-8 w-8 text-xs rounded-lg font-medium p-0"
                                    onClick={() => setCurrentPage(p)}
                                  >
                                    {p}
                                  </Button>
                                );
                              }
                              if (p === currentPage - 3 || p === currentPage + 3) {
                                return (
                                  <span key={p} className="text-muted-foreground px-1 text-xs select-none">
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            })
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 w-8 text-xs rounded-lg font-medium p-0"
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
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tambahkan Kartu Baru</CardTitle>
              <CardDescription>Isi data kartu RFID baru agar muncul di dashboard pengguna.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rfidTag">RFID Tag</Label>
                <Input
                  id="rfidTag"
                  value={rfidTag}
                  onChange={(event) => setRfidTag(event.target.value)}
                  placeholder="Contoh: 0x8823"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="balance">Saldo Awal</Label>
                  <Input
                    id="balance"
                    value={balance}
                    onChange={(event) => setBalance(event.target.value)}
                    placeholder="0"
                    type="number"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    placeholder="active"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">User (opsional)</Label>
                <select
                  id="userId"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <option value="">Pilih user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} • {user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastBusId">Bus Terakhir (opsional)</Label>
                <select
                  id="lastBusId"
                  value={lastBusId}
                  onChange={(event) => setLastBusId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <option value="">Pilih bus</option>
                  {buses.map((bus) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.busCode} • {bus.plateNumber}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleCreateCard}
                className="rounded-md bg-[linear-gradient(135deg,#ff9a4df2_0%,#ff7a2fd9_100%)] text-white shadow-[0_12px_30px_rgba(255,122,47,0.28)] hover:opacity-95"
                disabled={createCardMutation.isPending}
              >
                <Plus className="mr-2" /> Tambah Kartu
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
