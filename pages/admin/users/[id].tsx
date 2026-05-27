import { AdminLayout } from "@/components/admin/layout";
import { AdminPageHeader } from "@/components/admin/page-header";
import UserForm from "@/components/user/UserForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function EditUserPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.errors?.[0]?.message || "Gagal mengambil data");
      return json;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.errors?.[0]?.message || "Gagal mengupdate data");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      toast.success("Berhasil mengupdate pengguna!");
      router.push("/admin/users");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
          <AdminPageHeader
            eyebrow="User Editor"
            title="Edit Data Pengguna"
            description="Ubah data pengguna sistem Anda."
          />

        {isLoading ? (
          <div className="p-12 text-center"><p className="text-gray-500 animate-pulse font-medium">Memuat data pengguna...</p></div>
        ) : userData?.data ? (
          <UserForm 
            editUser={userData.data}
            onSubmit={(data) => updateMutation.mutate(data)} 
            isPending={updateMutation.isPending}
          />
        ) : (
          <div className="p-12 text-center text-red-500 font-medium">Data pengguna tidak ditemukan.</div>
        )}
      </div>
    </AdminLayout>
  );
}
