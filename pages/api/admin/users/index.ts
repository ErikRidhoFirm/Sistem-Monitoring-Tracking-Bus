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
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;

      const whereClause: any = {
        AND: []
      };

      if (role && role !== "Semua") {
        whereClause.AND.push({ role: role });
      }

      if (search && search.trim()) {
        whereClause.AND.push({
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        });
      }

      const finalWhere = whereClause.AND.length > 0 ? whereClause : undefined;

      const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
          where: finalWhere,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        prisma.user.count({
          where: finalWhere
        })
      ]);

      // Calculate stats for summary cards in the database
      const [totalUsers, totalAdmin, totalUserBiasa, totalVerified] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.user.count({ where: { role: "USER" } }),
        prisma.user.count({ where: { emailVerified: true } })
      ]);

      return ApiResponses.success(res, {
        users,
        total,
        stats: {
          totalUsers,
          totalAdmin,
          totalUserBiasa,
          totalVerified
        }
      });
    } catch (error: any) {
      return ApiResponses.error(res, {
        status: 500,
        errors: [{ message: error.message || "Gagal mengambil data user secara server-side" }],
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
