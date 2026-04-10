import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Buat akun</CardTitle>
          <CardDescription>
            Daftar dengan email dan password untuk mulai menggunakan aplikasi.
          </CardDescription>
        </CardHeader>

        <CardContent>
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
                {...register("name")}
              />
              {errors.name ? (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            {submitSuccess ? (
              <p className="text-sm text-green-600">{submitSuccess}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Membuat akun..." : "Daftar"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
