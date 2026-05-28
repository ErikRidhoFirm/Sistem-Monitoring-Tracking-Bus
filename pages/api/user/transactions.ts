import { ApiResponses } from "@/lib/api-response";
import { getSessionFromRequest } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { TransactionTypeValue } from "@/types/transaction-type";

const transactionsQuerySchema = z.object({
  search: z.string().trim().optional(),
  type: z.nativeEnum(TransactionTypeValue).or(z.literal("ALL")).optional().default("ALL"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  const search = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;
  const type = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type;
  const page = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
  const limitQuery = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;

  const parseQuery = transactionsQuerySchema.safeParse({
    search,
    type,
    page,
    limit: limitQuery,
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

  const { search: searchTerm, type: txType, page: currentPage, limit } = parseQuery.data;

  const whereClause: any = {
    card: {
      userId: session.user.id,
    },
  };

  if (txType !== "ALL") {
    whereClause.type = txType;
  }

  if (searchTerm) {
    whereClause.OR = [
      { rfidTag: { contains: searchTerm, mode: "insensitive" } },
      { stationName: { contains: searchTerm, mode: "insensitive" } },
      { bus: { busCode: { contains: searchTerm, mode: "insensitive" } } },
      { bus: { plateNumber: { contains: searchTerm, mode: "insensitive" } } },
    ];
  }

  const skip = (currentPage - 1) * limit;

  const [total, transactions] = await prisma.$transaction([
    prisma.transaction.count({ where: whereClause }),
    prisma.transaction.findMany({
      where: whereClause,
      select: {
        id: true,
        type: true,
        amount: true,
        createdAt: true,
        stationName: true,
        latTap: true,
        lngTap: true,
        rfidTag: true,
        bus: {
          select: {
            busCode: true,
            plateNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
  ]);

  return ApiResponses.success(res, { transactions, total });
}
