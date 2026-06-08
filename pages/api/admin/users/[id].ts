import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { ApiResponses } from "@/lib/api-response";
import { getSessionFromRequest, isAdminRole } from "@/lib/api-session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSessionFromRequest(req);
  
  if (!session || !isAdminRole(session.user.role)) {
    return ApiResponses.error(res, {
      status: 401,
      errors: [{ message: "Unauthorized" }],
    });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return ApiResponses.error(res, {
      status: 400,
      errors: [{ message: "User ID is required" }],
    });
  }

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        return ApiResponses.error(res, {
          status: 404,
          errors: [{ message: "User not found" }],
        });
      }
      return ApiResponses.success(res, user);
    } catch (error: any) {
      return ApiResponses.error(res, {
        status: 500,
        errors: [{ message: error.message || "Gagal mengambil data user" }],
      });
    }
  }

  if (req.method === "PUT") {
    try {
      const { name, email, role, emailVerified, image } = req.body;
      
      const user = await prisma.user.update({
        where: { id },
        data: {
          name,
          email,
          role,
          emailVerified,
          image,
        },
      });
      
      return ApiResponses.success(res, user);
    } catch (error: any) {
      return ApiResponses.error(res, {
        status: 500,
        errors: [{ message: error.message || "Gagal mengupdate data user" }],
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      const userToDelete = await prisma.user.findUnique({
        where: { id },
      });

      if (!userToDelete) {
        return ApiResponses.error(res, {
          status: 404,
          errors: [{ message: "User tidak ditemukan" }],
        });
      }

      if (userToDelete.role === "ADMIN") {
        return ApiResponses.error(res, {
          status: 400,
          errors: [{ message: "Anda tidak dapat menghapus user dengan role ADMIN" }],
        });
      }

      await prisma.user.delete({
        where: { id },
      });
      return ApiResponses.success(res, { deleted: true });
    } catch (error: any) {
      return ApiResponses.error(res, {
        status: 500,
        errors: [{ message: error.message || "Gagal menghapus data user" }],
      });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return ApiResponses.error(res, {
    status: 405,
    errors: [{ message: "Method Not Allowed" }],
  });
}
