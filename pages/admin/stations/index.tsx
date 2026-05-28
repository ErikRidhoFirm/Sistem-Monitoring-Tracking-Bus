import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { useRouter } from "next/router";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AdminLayout } from "@/components/admin/layout";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  StationItem,
  useAdminStations,
  useCreateStationMutation,
  useDeleteStationMutation,
  useUpdateStationMutation,
} from "@/lib/hooks/use-admin-stations";

const stationFormSchema = z.object({
  name: z.string().trim().min(1, "Nama halte wajib diisi"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().positive(),
});

type StationFormInput = z.input<typeof stationFormSchema>;
type StationFormValues = z.output<typeof stationFormSchema>;

const defaults: StationFormValues = {
  name: "",
  latitude: -7.2575,
  longitude: 112.7521,
  radius: 50,
};

export default function AdminStationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editingStation, setEditingStation] = useState<StationItem | null>(null);
  const [deletingStationId, setDeletingStationId] = useState<string | null>(null);

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

  const stationsQuery = useAdminStations(search, currentPage, itemsPerPage);
  const createStationMutation = useCreateStationMutation();
  const updateStationMutation = useUpdateStationMutation();
  const deleteStationMutation = useDeleteStationMutation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StationFormInput, unknown, StationFormValues>({
    resolver: zodResolver(stationFormSchema),
    defaultValues: defaults,
  });

  const onEdit = (station: StationItem) => {
    setEditingStation(station);
    setValue("name", station.name);
    setValue("latitude", station.latitude);
    setValue("longitude", station.longitude);
    setValue("radius", station.radius);
  };

  const resetForm = () => {
    setEditingStation(null);
    reset(defaults);
  };

  const onSubmit = async (values: StationFormValues) => {
    try {
      if (editingStation) {
        await updateStationMutation.mutateAsync({
          id: editingStation.id,
          payload: values,
        });
        toast.success("Halte berhasil diperbarui");
      } else {
        await createStationMutation.mutateAsync(values);
        toast.success("Halte berhasil ditambahkan");
      }

      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan halte");
    }
  };

  const onDelete = async (id: string) => {
    setDeletingStationId(id);

    try {
      await deleteStationMutation.mutateAsync(id);
      toast.success("Halte berhasil dihapus");

      if (editingStation?.id === id) {
        resetForm();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus halte");
    } finally {
      setDeletingStationId(null);
    }
  };

  const stations = stationsQuery.data?.stations ?? [];
  const totalItems = stationsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
          <AdminPageHeader
            eyebrow="Station Studio"
            title="Manajemen Halte"
            description="Atur data halte untuk geofencing tap in dan tap out."
          />

        <Card>
          <CardHeader>
            <CardTitle>{editingStation ? "Edit Halte" : "Tambah Halte"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Halte</Label>
                <Input id="name" {...register("name")} />
                {errors.name ? (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                ) : null}
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input id="latitude" type="number" step="any" {...register("latitude")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    {...register("longitude")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="radius">Radius (meter)</Label>
                  <Input id="radius" type="number" {...register("radius")} />
                </div>
              </div>

              {(errors.latitude || errors.longitude || errors.radius) && (
                <p className="text-sm text-destructive">
                  Pastikan latitude/longitude/radius valid.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  className="rounded-md bg-[linear-gradient(135deg,#ff9a4df2_0%,#ff7a2fd9_100%)] text-white shadow-[0_12px_30px_rgba(255,122,47,0.28)] hover:opacity-95"
                  disabled={
                    isSubmitting ||
                    createStationMutation.isPending ||
                    updateStationMutation.isPending
                  }
                >
                  {editingStation
                    ? updateStationMutation.isPending
                      ? "Menyimpan..."
                      : "Simpan Perubahan"
                    : createStationMutation.isPending
                      ? "Menambahkan..."
                      : "Tambah Halte"}
                </Button>
                {editingStation ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={
                      createStationMutation.isPending || updateStationMutation.isPending
                    }
                  >
                    Batal Edit
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Halte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="searchStation">Cari halte</Label>
              <Input
                id="searchStation"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari berdasarkan nama halte"
              />
            </div>

            {stationsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Memuat data halte...</p>
            ) : null}

            {stationsQuery.isError ? (
              <p className="text-sm text-destructive">
                {stationsQuery.error instanceof Error
                  ? stationsQuery.error.message
                  : "Gagal memuat data halte"}
              </p>
            ) : null}

            {!stationsQuery.isLoading && !stationsQuery.isError ? (
              <>
                <div className="w-full overflow-x-auto">
                  <table className="min-w-[800px] w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-2 py-2 font-medium">Nama</th>
                      <th className="px-2 py-2 font-medium">Latitude</th>
                      <th className="px-2 py-2 font-medium">Longitude</th>
                      <th className="px-2 py-2 font-medium">Radius</th>
                      <th className="px-2 py-2 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations.length ? (
                      stations.map((station) => (
                        <tr key={station.id} className="border-b">
                          <td className="px-2 py-3 font-medium">{station.name}</td>
                          <td className="px-2 py-3">{station.latitude}</td>
                          <td className="px-2 py-3">{station.longitude}</td>
                          <td className="px-2 py-3">{station.radius} m</td>
                          <td className="px-2 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => onEdit(station)}
                                disabled={deleteStationMutation.isPending}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                disabled={deleteStationMutation.isPending}
                                onClick={() => onDelete(station.id)}
                              >
                                {deleteStationMutation.isPending &&
                                deletingStationId === station.id
                                  ? "Menghapus..."
                                  : "Hapus"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-2 py-3 text-muted-foreground">
                          Belum ada data halte.
                        </td>
                      </tr>
                    )}
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
                      dari <span className="font-semibold text-foreground">{totalItems}</span> halte
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
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
