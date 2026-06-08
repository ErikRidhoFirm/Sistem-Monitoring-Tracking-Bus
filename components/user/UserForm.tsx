import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  image: string | null;
}

interface Props {
  onSubmit: (data: Omit<User, "id" | "createdAt" | "updatedAt"> & { password?: string }, id?: string) => void;
  editUser?: User | null;
  isPending?: boolean;
}

export default function UserForm({ onSubmit, editUser, isPending }: Props) {
  const [name, setName] = useState(editUser?.name || "");
  const [email, setEmail] = useState(editUser?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(editUser?.role || "USER");
  const [image, setImage] = useState(editUser?.image || "");
  const [emailVerified, setEmailVerified] = useState(editUser?.emailVerified || false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi ukuran file (misal maksimal 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran foto maksimal 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!name || !email) {
      alert("Nama dan Email wajib diisi!");
      return;
    }

    if (!editUser && !password) {
      alert("Password wajib diisi untuk pengguna baru!");
      return;
    }

    onSubmit({ name, email, role, emailVerified, image, ...(password ? { password } : {}) }, editUser?.id);
  };

  return (
    <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm space-y-4">
      <h2 className="font-bold text-lg text-gray-900">
        {editUser ? "Edit Data User" : "Tambah User Baru"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Masukkan nama" 
            className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Email</label>
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="email@contoh.com" 
            type="email"
            className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>

        {!editUser && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Masukkan password" 
                type={showPassword ? "text" : "password"}
                className="w-full bg-gray-50 border border-gray-200 pl-3 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role / Peran</label>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input 
          type="checkbox" 
          id="verified"
          checked={emailVerified}
          onChange={(e) => setEmailVerified(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
        <label htmlFor="verified" className="text-sm font-medium text-gray-700 cursor-pointer">
          Tandai Email sebagai Terverifikasi
        </label>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
        <button 
          onClick={handleSubmit} 
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {editUser ? "Simpan Perubahan" : "Simpan Data"}
        </button>
      </div>
    </div>
  );
}