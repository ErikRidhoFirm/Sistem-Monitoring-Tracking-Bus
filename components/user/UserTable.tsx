import { Eye } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
}

interface Props {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onView: (user: User) => void;
}

export default function UserTable({ users, onEdit, onDelete, onView }: Props) {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            <th className="px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-16 text-center">No</th>
            <th className="px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Lengkap</th>
            <th className="px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</th>
            <th className="px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
            <th className="px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
            <th className="px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-transparent divide-y divide-border/25">
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground text-sm">
                Belum ada data pengguna yang tersimpan.
              </td>
            </tr>
          ) : (
            users.map((user, index) => (
              <tr key={user.id} className="hover:bg-muted/15 transition-colors">
                <td className="px-5 py-4 text-sm text-muted-foreground text-center font-medium">
                  {index + 1}
                </td>
                
                <td className="px-5 py-4 text-sm font-semibold text-foreground">
                  {user.name}
                </td>
                
                <td className="px-5 py-4 text-sm text-muted-foreground">
                  {user.email}
                </td>

                <td className="px-5 py-4 text-sm">
                  <span className="text-gray-600 font-medium">{user.role}</span>
                </td>
                
                <td className="px-5 py-4 text-sm">
                  {user.emailVerified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Terverifikasi
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      Belum Aktif
                    </span>
                  )}
                </td>
                
                <td className="px-5 py-4 text-right flex justify-end gap-2">
                  <button 
                    onClick={() => onView(user)} 
                    className="p-1.5 border border-blue-100 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 transition shadow-sm"
                    title="Lihat Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onEdit(user)} 
                    className="p-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-600 transition shadow-sm"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  {user.role !== "ADMIN" && (
                    <button 
                      onClick={() => onDelete(user.id)} 
                      className="p-1.5 border border-red-100 rounded-md bg-red-50 hover:bg-red-100 text-red-500 transition shadow-sm"
                      title="Hapus"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}