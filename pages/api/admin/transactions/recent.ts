import { ApiResponses } from "@/lib/api-response";
import { getSessionFromRequest, isAdminRole } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const recentTransactionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional().default(5),
  busId: z.string().trim().min(1).optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
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

  if (!isAdminRole(session.user.role)) {
    return ApiResponses.error(res, {
      status: 403,
      errors: [{ key: "FORBIDDEN", message: "Forbidden" }],
    });
  }

  const parseQuery = recentTransactionsQuerySchema.safeParse({
    limit: req.query.limit,
    busId: req.query.busId,
  });

  if (!parseQuery.success) {
    return ApiResponses.error(res, {
      status: 400,
      errors: parseQuery.error.issues.map((issue) => ({
        key: "VALIDATION_ERROR",
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const { limit, busId } = parseQuery.data;
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0,
  );

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(busId ? { busId } : {}),
      createdAt: {
        gte: startOfToday,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    include: {
      card: {
        select: {
          rfidTag: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      bus: {
        select: {
          id: true,
          busCode: true,
          plateNumber: true,
        },
      },
    },
  });

  return ApiResponses.success(res, {
    transactions,
  });
}
