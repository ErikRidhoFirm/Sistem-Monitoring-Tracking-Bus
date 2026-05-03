import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { ApiResponses } from "@/lib/api-response";
import { getSessionFromRequest, isAdminRole } from "@/lib/api-session";
import { auth } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSessionFromRequest(req);
  
  if (!session || !isAdminRole(session.user.role)) {
    return ApiResponses.error(res, {
      status: 401,
      errors: [{ message: "Unauthorized" }],
    });
  }

  if (req.method === "GET") {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      });
      return ApiResponses.success(res, users);
    } catch (error: any) {
      return ApiResponses.error(res, {
        status: 500,
        errors: [{ message: error.message || "Gagal mengambil data user" }],
      });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, email, password, role, image, emailVerified } = req.body;

      if (!name || !email || !password) {
        return ApiResponses.error(res, {
          status: 400,
          errors: [{ message: "Nama, email, dan password wajib diisi" }],
        });
      }

      // Menggunakan auth dari Better Auth untuk membuat akun dengan password
      // Ini akan membuat record di tabel User dan Account (untuk kredensial)
      const headers = new Headers();
      // Mengirim POST ke server API bawaan Better Auth untuk registrasi
      // tapi kita ambil resultnya saja
      const result = await auth.api.signUpEmail({
        headers,
        body: {
          name,
          email,
          password,
        },
      });

      if (result?.user) {
        // Update data tambahan yang tidak di-handle oleh signUp biasa
        const updatedUser = await prisma.user.update({
          where: { id: result.user.id },
          data: {
            role: role || "USER",
            emailVerified: emailVerified || false,
            image: image || null,
          },
        });
        return ApiResponses.success(res, updatedUser);
      }

      return ApiResponses.error(res, {
        status: 400,
        errors: [{ message: "Gagal membuat user" }],
      });
    } catch (error: any) {
      return ApiResponses.error(res, {
        status: 500,
        errors: [{ message: error.message || "Gagal membuat data user" }],
      });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return ApiResponses.error(res, {
    status: 405,
    errors: [{ message: "Method Not Allowed" }],
  });
}
