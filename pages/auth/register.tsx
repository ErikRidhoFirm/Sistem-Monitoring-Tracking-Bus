import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { authClient } from "@/lib/auth-client";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z
      .string()
      .min(8, "Konfirmasi password minimal 8 karakter"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Password dan konfirmasi harus sama",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitSuccess(null);

    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: "/",
    });

    if (error) {
      toast.error(error.message ?? "Gagal membuat akun. Coba lagi.");
      return;
    }

    setSubmitSuccess("Akun berhasil dibuat. Kamu bisa lanjut login.");
  };

  return (
    <AuthShell
      badge="Buat Akun"
      title="Daftar ke Buswy"
      description="Buat akun untuk mengakses dashboard, melihat bus terdekat, dan mengikuti status perjalanan dengan tampilan yang seragam di seluruh halaman."
      footerQuestion="Sudah punya akun?"
      footerLinkHref="/auth/login"
      footerLinkLabel="Login"
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="name">Nama</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            className="h-12 rounded-2xl border-[#245bb0]/20 bg-white/80"
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="h-12 rounded-2xl border-[#245bb0]/20 bg-white/80"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            className="h-12 rounded-2xl border-[#245bb0]/20 bg-white/80"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Konfirmasi password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="h-12 rounded-2xl border-[#245bb0]/20 bg-white/80"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        {submitSuccess ? (
          <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {submitSuccess}
          </p>
        ) : null}

        <Button
          type="submit"
          className="h-12 w-full rounded-full bg-[#1f3d3a] font-semibold text-[#f4f1e8] transition hover:bg-[#132b29]"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Membuat akun..." : "Daftar"}
        </Button>

        <p className="text-center text-sm text-[#1f3d3a]/70 sm:hidden">
          Sudah punya akun?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-[#173330] underline-offset-4 hover:underline"
          >
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
