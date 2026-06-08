import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { ApiResponses } from "@/lib/api-response";
import { getSessionFromRequest } from "@/lib/api-session";
import { auth } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return ApiResponses.error(res, {
      status: 405,
      errors: [{ key: "METHOD_NOT_ALLOWED", message: "Method Not Allowed" }],
    });
  }

  const session = await getSessionFromRequest(req);
  if (!session?.user) {
    return ApiResponses.error(res, {
      status: 401,
      errors: [{ key: "UNAUTHORIZED", message: "Unauthorized" }],
    });
  }

  const { name, email, currentPassword, newPassword } = req.body;

  if (!name || !email) {
    return ApiResponses.error(res, {
      status: 400,
      errors: [{ key: "VALIDATION_ERROR", message: "Nama dan email wajib diisi" }],
    });
  }

  try {
    const userId = session.user.id;
    const headers = new Headers();
    if (req.headers.cookie) {
      headers.set("cookie", req.headers.cookie);
    }
    if (req.headers.authorization) {
      headers.set("authorization", req.headers.authorization);
    }

    // 1. Password change requested
    if (newPassword || currentPassword) {
      if (!currentPassword || !newPassword) {
        return ApiResponses.error(res, {
          status: 400,
          errors: [{ key: "VALIDATION_ERROR", message: "Sandi saat ini dan sandi baru wajib diisi untuk mengubah kata sandi" }],
        });
      }

      // Verify current password
      const credentialAccount = await prisma.account.findFirst({
        where: {
          userId,
          providerId: "credential",
        },
      });

      if (!credentialAccount || !credentialAccount.password) {
        return ApiResponses.error(res, {
          status: 400,
          errors: [{ key: "VALIDATION_ERROR", field: "currentPassword", message: "Akun Anda tidak dikonfigurasi dengan kata sandi" }],
        });
      }

      const ctx = await auth.$context;
      const isValid = await ctx.password.verify({
        hash: credentialAccount.password,
        password: currentPassword,
      });

      if (!isValid) {
        return ApiResponses.error(res, {
          status: 400,
          errors: [{ key: "VALIDATION_ERROR", field: "currentPassword", message: "Sandi saat ini salah" }],
        });
      }

      try {
        const passwordHash = await ctx.password.hash(newPassword);
        
        // Update the existing password
        await prisma.account.update({
          where: { id: credentialAccount.id },
          data: { password: passwordHash },
        });
      } catch (err: any) {
        return ApiResponses.error(res, {
          status: 400,
          errors: [
            {
              key: "VALIDATION_ERROR",
              field: "newPassword",
              message: err.message || "Gagal mengubah password",
            },
          ],
        });
      }
    }

    // 2. Email change requested - check uniqueness
    if (email !== session.user.email) {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return ApiResponses.error(res, {
          status: 400,
          errors: [
            {
              key: "VALIDATION_ERROR",
              field: "email",
              message: "Email sudah digunakan oleh pengguna lain",
            },
          ],
        });
      }
    }

    // 3. Update the fields in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
      },
    });

    return ApiResponses.success(res, updatedUser);
  } catch (error: any) {
    console.error("Update profile error:", error);
    return ApiResponses.error(res, {
      status: 500,
      errors: [{ message: error.message || "Gagal memperbarui profil" }],
    });
  }
}
