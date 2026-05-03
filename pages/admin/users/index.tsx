import { useState } from "react";
import { AdminLayout } from "@/components/admin/layout";
import UserTable from "@/components/user/UserTable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/router";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string; 
}

export default function UserPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // State untuk Search dan Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"Semua" | "ADMIN" | "USER">("Semua");

  // GET: Mengambil data user
  const { data: usersData, isLoading } = useQuery<{ data: User[] }>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.errors?.[0]?.message || "Gagal mengambil data");
      return json;
    },
  });

  const users = usersData?.data || [];

  // DELETE: Hapus User
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.errors?.[0]?.message || "Gagal menghapus data");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Berhasil menghapus pengguna!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (user: User) => {
    router.push(`/admin/users/${user.id}`);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Yakin ingin menghapus data user ini?")) return;
    deleteMutation.mutate(id);
  };

  // Kalkulasi Statistik
  const totalUsers = users.length;
  const totalAdmin = users.filter((u: User) => u.role === 'ADMIN').length;
  const totalUserBiasa = users.filter((u: User) => u.role === 'USER').length;
  const totalVerified = users.filter((u: User) => u.emailVerified).length;

  // Filter Data Tabel
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRole === "Semua" ? true : user.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Data Pengguna</h1>
            <p className="text-gray-500 text-sm mt-1">Tambah, edit, dan pantau peran pengguna sistem Anda</p>
          </div>

          <div className="flex gap-3">
            <Link 
              href="/admin/users/create"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              <span>Tambah User Baru</span>
            </Link>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">Total Pengguna</h3>
            <p className="text-3xl font-bold text-gray-900 mt-3">{isLoading ? "..." : totalUsers}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">Admin Aktif</h3>
            <p className="text-3xl font-bold text-gray-900 mt-3">{isLoading ? "..." : totalAdmin}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">User Biasa</h3>
            <p className="text-3xl font-bold text-gray-900 mt-3">{isLoading ? "..." : totalUserBiasa}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">Email Terverifikasi</h3>
            <p className="text-3xl font-bold text-gray-900 mt-3">{isLoading ? "..." : totalVerified}</p>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Daftar Pengguna</h2>
              <p className="text-sm text-gray-500">Cari berdasarkan nama atau email.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input 
                  type="text" 
                  placeholder="Cari user..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                />
              </div>

              <div className="flex bg-gray-100 rounded-full p-1 border border-gray-200">
                {(["Semua", "ADMIN", "USER"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterRole(tab)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full transition ${
                      filterRole === tab 
                        ? "bg-blue-600 text-white shadow" 
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center"><p className="text-gray-500 animate-pulse font-medium">Memuat data pengguna...</p></div>
          ) : (
            <div className="relative">
              {deleteMutation.isPending && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              <UserTable users={filteredUsers} onEdit={handleEdit} onDelete={handleDelete} />
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}