import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { authClient } from "@/lib/auth-client";
import { UserRole } from "@/types/user-role";

const loginSchema = z.object({
  email: z.email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe,
    });

    if (error) {
      toast.error(error.message ?? "Email atau password salah.");
      return;
    }

    try {
      const response = await fetch("/api/user/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil data pengguna");
      }

      const payload = await response.json();
      const user = payload.data;
      const targetRoute =
        user?.role === UserRole.ADMIN ? "/admin" : "/user";

      toast.success("Login berhasil");
      await router.push(targetRoute);
    } catch {
      toast.error("Login berhasil, tetapi gagal menentukan halaman tujuan.");
      await router.push("/");
    }
  };

  return (
    <AuthShell
      badge="Masuk Akun"
      title="Masuk ke Buswy"
      description="Masuk untuk melihat dashboard, memantau armada, dan membuka live map dengan cepat."
      footerQuestion="Belum punya akun?"
      footerLinkHref="/auth/register"
      footerLinkLabel="Daftar"
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
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
            autoComplete="current-password"
            className="h-12 rounded-2xl border-[#245bb0]/20 bg-white/80"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <label
          className="flex items-center gap-2 text-sm text-[#1f3d3a]/70"
          htmlFor="rememberMe"
        >
          <input
            id="rememberMe"
            type="checkbox"
            className="size-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring/30"
            {...register("rememberMe")}
          />
          Ingat saya
        </label>

        <Button
          type="submit"
          className="h-12 w-full rounded-full bg-[#1f3d3a] font-semibold text-[#f4f1e8] transition hover:bg-[#132b29]"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Memproses..." : "Login"}
        </Button>

        <p className="text-center text-sm text-[#1f3d3a]/70 sm:hidden">
          Belum punya akun?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-[#173330] underline-offset-4 hover:underline"
          >
            Daftar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
