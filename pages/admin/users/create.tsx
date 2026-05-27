import { AdminLayout } from "@/components/admin/layout";
import { AdminPageHeader } from "@/components/admin/page-header";
import UserForm from "@/components/user/UserForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function CreateUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.errors?.[0]?.message || "Gagal menyimpan data");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Berhasil menambahkan pengguna!");
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
            eyebrow="User Creator"
            title="Tambah Pengguna Baru"
            description="Isi formulir di bawah ini untuk menambahkan pengguna ke dalam sistem."
          />

        <UserForm 
          onSubmit={(data) => createMutation.mutate(data)} 
          isPending={createMutation.isPending}
        />
      </div>
    </AdminLayout>
  );
}
