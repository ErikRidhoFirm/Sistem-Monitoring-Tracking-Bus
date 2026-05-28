import { AdminLayout } from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import {
  BusItem,
  useAdminBuses,
  useCreateBusMutation,
  useDeleteBusMutation,
  useUpdateBusMutation,
} from "@/lib/hooks/use-admin-buses";
import {
  BusFront,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Gauge,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { AdminPageHeader } from "@/components/admin/page-header";

type BusFormValues = {
  busCode: string;
  plateNumber: string;
  routeId: string | null;
  isActive: boolean;
  maxPassengers: string;
  price: string;
};

const defaultFormValues: BusFormValues = {
  busCode: "",
  plateNumber: "",
  routeId: null,
  isActive: true,
  maxPassengers: "50",
  price: "2500",
};

export default function AdminBusPage() {
  const router = useRouter();

  // Search and Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<BusItem | null>(null);
  const [formValues, setFormValues] =
    useState<BusFormValues>(defaultFormValues);

  // Pagination states (URL Query Param-Based)
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

  const busesQuery = useAdminBuses(search, currentPage, itemsPerPage, statusFilter);
  const createBusMutation = useCreateBusMutation();
  const updateBusMutation = useUpdateBusMutation();
  const deleteBusMutation = useDeleteBusMutation();

  const busList = useMemo(
    () => busesQuery.data?.buses ?? [],
    [busesQuery.data],
  );
  const routeOptions = useMemo(
    () => busesQuery.data?.routes ?? [],
    [busesQuery.data],
  );

  // Since filtering and pagination is performed 100% server-side:
  const filteredBuses = busList;

  // Aggregate stats from the server
  const totalItems = busesQuery.data?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const totalBuses = busesQuery.data?.stats?.totalBuses ?? 0;
  const activeCount = busesQuery.data?.stats?.activeCount ?? 0;
  const inactiveCount = busesQuery.data?.stats?.inactiveCount ?? 0;
  const totalPassengers = busesQuery.data?.stats?.totalPassengers ?? 0;

  const summaryCards = [
    {
      label: "Total Armada",
      value: totalBuses,
      description: "Seluruh armada yang terdaftar di sistem.",
      icon: BusFront,
      iconClassName: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
    },
    {
      label: "Armada Aktif",
      value: activeCount,
      description: "Bus yang sedang beroperasi saat ini.",
      icon: Sparkles,
      iconClassName: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    },
    {
      label: "Status Nonaktif",
      value: inactiveCount,
      description: "Armada yang belum aktif atau sedang berhenti.",
      icon: Gauge,
      iconClassName: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    },
    {
      label: "Total Penumpang",
      value: totalPassengers,
      description: "Akumulasi penumpang dari seluruh armada.",
      icon: Users,
      iconClassName: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
    },
  ];
  const isSaving = createBusMutation.isPending || updateBusMutation.isPending;

  const openCreateDialog = () => {
    setEditingBus(null);
    setFormValues(defaultFormValues);
    setIsDialogOpen(true);
  };

  const openEditDialog = (busItem: BusItem) => {
    setEditingBus(busItem);
    setFormValues({
      busCode: busItem.busCode,
      plateNumber: busItem.plateNumber,
      routeId: busItem.route?.id ?? null,
      isActive: busItem.isActive,
      maxPassengers: String(busItem.maxPassengers ?? 50),
      price: String(busItem.price ?? 2500),
    });
    setIsDialogOpen(true);
  };

  const resetDialog = () => {
    setEditingBus(null);
    setFormValues(defaultFormValues);
    setIsDialogOpen(false);
  };

  const saveBus = async () => {
    if (!formValues.busCode || !formValues.plateNumber) {
      toast.error("Kode bus dan nomor polisi wajib diisi");
      return;
    }

    const parsedMaxPassengers = Number(formValues.maxPassengers);
    const parsedPrice = Number(formValues.price);

    if (!Number.isInteger(parsedMaxPassengers) || parsedMaxPassengers < 1) {
      toast.error("Kapasitas maksimal harus angka bulat minimal 1");
      return;
    }

    try {
      if (editingBus) {
        await updateBusMutation.mutateAsync({
          id: editingBus.id,
          payload: {
            busCode: formValues.busCode,
            plateNumber: formValues.plateNumber,
            isActive: formValues.isActive,
            maxPassengers: parsedMaxPassengers,
            price: parsedPrice,
            routeId: formValues.routeId,
          },
        });
        toast.success("Bus berhasil diperbarui");
      } else {
        await createBusMutation.mutateAsync({
          busCode: formValues.busCode,
          plateNumber: formValues.plateNumber,
          isActive: formValues.isActive,
          maxPassengers: parsedMaxPassengers,
          price: parsedPrice,
          routeId: formValues.routeId,
        });
        toast.success("Bus berhasil ditambahkan");
      }
      resetDialog();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan bus",
      );
    }
  };

  const deleteBus = async (id: string) => {
    try {
      await deleteBusMutation.mutateAsync(id);
      toast.success("Bus berhasil dihapus");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus bus",
      );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Bus Management"
          title="Kelola Data Bus"
          description="Tambah, edit, dan pantau status armada bus Anda."
          actions={
            <>
            <Button
              variant="secondary"
              size="sm"
              className="h-10 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-[#f4f1e8] shadow-sm backdrop-blur transition-colors hover:bg-white/15"
            >
              <Download className="mr-2" /> Export CSV
            </Button>
            <Button size="sm" className="rounded-full bg-[linear-gradient(135deg,#ff9a4df2_0%,#ff7a2fd9_100%)] text-white shadow-[0_12px_30px_rgba(255,122,47,0.28)] hover:opacity-95" onClick={openCreateDialog}>
              <Plus className="mr-2" /> Tambah Bus Baru
            </Button>
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <Card
                key={card.label}
                className="overflow-hidden border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                  <div className="space-y-2">
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      {card.label}
                    </CardTitle>
                    <p className="max-w-[18ch] text-sm leading-6 text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                  <div className={`rounded-2xl p-3 ${card.iconClassName}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div
                    className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="min-w-0">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between flex-wrap">
            <div>
              <CardTitle>Daftar Bus</CardTitle>
              <CardDescription>
                Cari kode bus, nomor polisi, atau route.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap w-full sm:w-auto">
              <SearchInput
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari bus"
                className="w-full sm:w-72 shrink-0"
              />
              <div className="flex items-center gap-2 rounded-full border border-border bg-background p-1 text-sm shadow-sm">
                {(["ALL", "ACTIVE", "INACTIVE"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setStatusFilter(option);
                      setCurrentPage(1);
                    }}
                    className={`rounded-full px-3 py-1 transition ${
                      statusFilter === option
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option === "ALL"
                      ? "Semua"
                      : option === "ACTIVE"
                        ? "Aktif"
                        : "Nonaktif"}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-3 text-left whitespace-nowrap">
              <thead>
                <tr className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Kode Bus</th>
                  <th className="px-4 py-3">Nomor Polisi</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Penumpang</th>
                  <th className="px-4 py-3">Kapasitas Maks</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuses.map((busItem) => (
                  <tr
                    key={busItem.id}
                    className="rounded-[18px] border border-border bg-card text-sm shadow-sm"
                  >
                    <td className="px-4 py-4 align-top font-medium text-foreground">
                      {busItem.id}
                    </td>
                    <td className="px-4 py-4 align-top text-foreground">
                      {busItem.busCode}
                    </td>
                    <td className="px-4 py-4 align-top text-muted-foreground">
                      {busItem.plateNumber}
                    </td>
                    <td className="px-4 py-4 align-top text-muted-foreground">
                      {busItem.route?.routeName ?? "-"}
                    </td>
                    <td className="px-4 py-4 align-top text-foreground">
                      {busItem.passengerCount} / {busItem.maxPassengers}
                    </td>
                    <td className="px-4 py-4 align-top text-foreground">
                      {busItem.maxPassengers}
                    </td>
                    <td className="px-4 py-4 align-top text-foreground">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(busItem.price ?? 0)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          busItem.isActive
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        {busItem.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(busItem)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteBus(busItem.id)}
                          disabled={deleteBusMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                 {busesQuery.isLoading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Memuat data bus...
                      </div>
                    </td>
                  </tr>
                ) : filteredBuses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      Tidak ada bus yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : null}
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
                  dari <span className="font-semibold text-foreground">{totalItems}</span> armada bus
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
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border border-border bg-card">
          <DialogHeader>
            <DialogTitle>
              {editingBus ? "Edit Bus" : "Tambah Bus Baru"}
            </DialogTitle>
            <DialogDescription>
              Isi data armada bus untuk memperbarui status operasional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="busCode">Kode Bus</Label>
                <Input
                  id="busCode"
                  value={formValues.busCode}
                  onChange={(event) =>
                    setFormValues({
                      ...formValues,
                      busCode: event.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plateNumber">Nomor Polisi</Label>
                <Input
                  id="plateNumber"
                  value={formValues.plateNumber}
                  onChange={(event) =>
                    setFormValues({
                      ...formValues,
                      plateNumber: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="price">Harga (IDR)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formValues.price}
                  onChange={(event) =>
                    setFormValues({ ...formValues, price: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxPassengers">Kapasitas Maksimal</Label>
                <Input
                  id="maxPassengers"
                  type="number"
                  min="1"
                  value={formValues.maxPassengers}
                  onChange={(event) =>
                    setFormValues({
                      ...formValues,
                      maxPassengers: event.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="route">Route</Label>
                <select
                  id="route"
                  value={formValues.routeId ?? ""}
                  onChange={(event) =>
                    setFormValues({
                      ...formValues,
                      routeId: event.target.value || null,
                    })
                  }
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Pilih rute (opsional)</option>
                  {routeOptions.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.routeName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formValues.isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setFormValues({ ...formValues, isActive: true })
                    }
                  >
                    Aktif
                  </Button>
                  <Button
                    type="button"
                    variant={!formValues.isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setFormValues({ ...formValues, isActive: false })
                    }
                  >
                    Nonaktif
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={resetDialog} disabled={isSaving}>
              Batal
            </Button>
            <Button type="button" onClick={saveBus} disabled={isSaving}>
              {editingBus
                ? updateBusMutation.isPending
                  ? "Menyimpan..."
                  : "Simpan Perubahan"
                : createBusMutation.isPending
                  ? "Menambahkan..."
                  : "Tambah Bus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
