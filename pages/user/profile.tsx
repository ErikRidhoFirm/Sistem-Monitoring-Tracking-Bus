import type { GetServerSideProps, NextPage } from "next";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { Eye, EyeOff, User, Mail, Lock, ShieldAlert } from "lucide-react";

import { UserLayout } from "@/components/user/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getSessionFromRequest } from "@/lib/api-session";

type ProfilePageProps = {
  userName: string;
  userEmail: string;
};

const ProfilePage: NextPage<ProfilePageProps> = ({ userName, userEmail }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const schema = z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Format email tidak valid"),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  }).superRefine((data, ctx) => {
    const hasCurrent = !!data.currentPassword?.trim();
    const hasNew = !!data.newPassword?.trim();
    const hasConfirm = !!data.confirmPassword?.trim();

    if (hasCurrent || hasNew || hasConfirm) {
      if (!hasCurrent) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sandi saat ini wajib diisi untuk mengubah kata sandi",
          path: ["currentPassword"],
        });
      }
      if (!hasNew) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Kata sandi baru wajib diisi",
          path: ["newPassword"],
        });
      }
      if (!hasConfirm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Konfirmasi kata sandi baru wajib diisi",
          path: ["confirmPassword"],
        });
      }

      if (hasNew && data.newPassword && data.newPassword.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password baru minimal 6 karakter",
          path: ["newPassword"],
        });
      }

      if (hasNew && hasConfirm && data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Konfirmasi password tidak cocok",
          path: ["confirmPassword"],
        });
      }
    }
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: userName,
      email: userEmail,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          currentPassword: data.currentPassword || undefined,
          newPassword: data.newPassword || undefined,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.errors?.[0]?.message || "Gagal memperbarui profil");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Profil berhasil diperbarui!");
      setIsEditing(false);
      reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      router.replace(router.asPath);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: FormValues) => {
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    reset({
      name: userName,
      email: userEmail,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsEditing(false);
  };

  return (
    <UserLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <AdminPageHeader
          eyebrow="Profil User"
          title="Profil Pengguna"
          description="Kelola informasi akun Anda dengan tampilan yang konsisten dan profesional." 
        />

        {!isEditing ? (
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Informasi Akun</CardTitle>
              <CardDescription>Detail profil pengguna Anda saat ini.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-1 transition hover:border-gray-300">
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Nama Lengkap</span>
                    <span className="text-sm font-medium text-gray-950">{userName}</span>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-1 transition hover:border-gray-300">
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Email</span>
                    <span className="text-sm font-medium text-gray-950">{userEmail}</span>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button type="button" onClick={() => setIsEditing(true)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm">
                    Edit Profil
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border bg-card shadow-sm transition duration-300 animate-in fade-in slide-in-from-bottom-4">
            <CardHeader>
              <CardTitle>Perbarui Profil</CardTitle>
              <CardDescription>Ubah detail nama, email, atau sandi masuk Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Field Nama */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Nama Lengkap</Label>
                    <Input
                      id="name"
                      placeholder="Masukkan nama lengkap"
                      {...register("name")}
                      className={`w-full bg-background border ${errors.name ? 'border-red-500 ring-red-500' : 'border-border'} focus:ring-2`}
                    />
                    {errors.name && (
                      <p className="text-xs font-medium text-red-500 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Field Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@contoh.com"
                      {...register("email")}
                      className={`w-full bg-background border ${errors.email ? 'border-red-500 ring-red-500' : 'border-border'} focus:ring-2`}
                    />
                    {errors.email && (
                      <p className="text-xs font-medium text-red-500 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-bold text-gray-950 mb-3 flex items-center gap-1.5">
                    <Lock size={16} className="text-blue-600" /> Ubah Kata Sandi (Opsional)
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Field Sandi Saat Ini */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-sm font-semibold text-gray-700">Sandi Saat Ini</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Sandi saat ini"
                          {...register("currentPassword")}
                          className={`w-full bg-background pr-10 border ${errors.currentPassword ? 'border-red-500' : 'border-border'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                          {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.currentPassword && (
                        <p className="text-xs font-medium text-red-500 mt-1">{errors.currentPassword.message}</p>
                      )}
                    </div>

                    {/* Field Password Baru */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">Kata Sandi Baru</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Minimal 6 karakter"
                          {...register("newPassword")}
                          className={`w-full bg-background pr-10 border ${errors.newPassword ? 'border-red-500' : 'border-border'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.newPassword && (
                        <p className="text-xs font-medium text-red-500 mt-1">{errors.newPassword.message}</p>
                      )}
                    </div>

                    {/* Field Konfirmasi Password Baru */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Konfirmasi Kata Sandi Baru</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Ulangi kata sandi baru"
                          {...register("confirmPassword")}
                          className={`w-full bg-background pr-10 border ${errors.confirmPassword ? 'border-red-500' : 'border-border'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs font-medium text-red-500 mt-1">{errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateProfileMutation.isPending}
                    className="px-5 py-2 border border-border text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending && (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
};

export const getServerSideProps: GetServerSideProps<ProfilePageProps> = async (context) => {
  const session = await getSessionFromRequest(context.req);

  if (!session?.user) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  const userName = session.user.name || "Pengguna";
  const userEmail = session.user.email || "Tidak ada email";

  return {
    props: {
      userName,
      userEmail,
    },
  };
};

export default ProfilePage;
