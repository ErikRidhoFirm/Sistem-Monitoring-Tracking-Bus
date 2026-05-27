import { TransactionType } from "@/generated/prisma/client";
import { ApiErrorItem, ApiResponses } from "@/lib/api-response";
import { getSessionFromRequest, isAdminRole } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { TransactionTypeValue } from "@/types/transaction-type";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const listTransactionsQuerySchema = z.object({
  search: z.string().trim().optional(),
  type: z.nativeEnum(TransactionTypeValue).or(z.literal("ALL")).optional().default("ALL"),
});

const createTransactionSchema = z.object({
  type: z.nativeEnum(TransactionTypeValue),
  amount: z.number().min(0, "Jumlah tidak boleh negatif"),
  rfidTag: z.string().trim().min(1, "RFID Tag wajib diisi"),
  busId: z.string().trim().min(1, "Bus ID wajib diisi"),
  stationName: z.string().trim().optional(),
  latTap: z.number().optional().nullable(),
  lngTap: z.number().optional().nullable(),
});

function getValidationErrors(error: z.ZodError): ApiErrorItem[] {
  return error.issues.map((issue) => ({
    key: "VALIDATION_ERROR",
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
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

  // GET: List Transactions
  if (req.method === "GET") {
    const parseQuery = listTransactionsQuerySchema.safeParse({
      search: req.query.search,
      type: req.query.type,
    });

    if (!parseQuery.success) {
      return ApiResponses.error(res, {
        status: 400,
        errors: getValidationErrors(parseQuery.error),
      });
    }

    const { search, type } = parseQuery.data;

    // Filters
    const whereClause: any = {
      AND: [],
    };

    if (type && type !== "ALL") {
      whereClause.AND.push({ type: type as TransactionType });
    }

    if (search) {
      whereClause.AND.push({
        OR: [
          { rfidTag: { contains: search, mode: "insensitive" } },
          { stationName: { contains: search, mode: "insensitive" } },
          {
            card: {
              user: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
          {
            card: {
              user: {
                email: { contains: search, mode: "insensitive" },
              },
            },
          },
          {
            bus: {
              busCode: { contains: search, mode: "insensitive" },
            },
          },
          {
            bus: {
              plateNumber: { contains: search, mode: "insensitive" },
            },
          },
        ],
      });
    }

    try {
      const [transactions, cards, buses] = await prisma.$transaction([
        prisma.transaction.findMany({
          where: whereClause.AND.length > 0 ? whereClause : undefined,
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
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.card.findMany({
          select: {
            rfidTag: true,
          },
          orderBy: {
            rfidTag: "asc",
          },
        }),
        prisma.bus.findMany({
          select: {
            id: true,
            busCode: true,
            plateNumber: true,
          },
          orderBy: {
            busCode: "asc",
          },
        }),
      ]);

      const types = [
        TransactionTypeValue.IN,
        TransactionTypeValue.OUT,
        TransactionTypeValue.PENALTY,
      ];

      return ApiResponses.success(res, {
        transactions,
        cards,
        buses,
        types,
      }, {
        meta: {
          total: transactions.length,
        },
      });
    } catch (error) {
      return ApiResponses.error(res, {
        status: 500,
        errors: [
          {
            key: "INTERNAL_SERVER_ERROR",
            message: "Terjadi kesalahan saat memuat data transaksi",
          },
        ],
      });
    }
  }

  // POST: Create Transaction Manual
  const parseBody = createTransactionSchema.safeParse(req.body);

  if (!parseBody.success) {
    return ApiResponses.error(res, {
      status: 400,
      errors: getValidationErrors(parseBody.error),
    });
  }

  const payload = parseBody.data;

  // Validate Card exists
  const card = await prisma.card.findUnique({
    where: { rfidTag: payload.rfidTag },
  });

  if (!card) {
    return ApiResponses.error(res, {
      status: 400,
      errors: [
        {
          key: "VALIDATION_ERROR",
          field: "rfidTag",
          message: "Kartu RFID tidak ditemukan",
        },
      ],
    });
  }

  // Validate Bus exists
  const bus = await prisma.bus.findUnique({
    where: { id: payload.busId },
  });

  if (!bus) {
    return ApiResponses.error(res, {
      status: 400,
      errors: [
        {
          key: "VALIDATION_ERROR",
          field: "busId",
          message: "Bus tidak ditemukan",
        },
      ],
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          type: payload.type as TransactionType,
          amount: payload.amount,
          rfidTag: payload.rfidTag,
          busId: payload.busId,
          stationName: payload.stationName || "-",
          latTap: payload.latTap,
          lngTap: payload.lngTap,
        },
        include: {
          card: {
            select: {
              rfidTag: true,
            },
          },
          bus: {
            select: {
              id: true,
              busCode: true,
            },
          },
        },
      });

      // 2. Update Card balance and status
      let cardUpdateData: any = {};
      if (payload.type === TransactionTypeValue.IN) {
        cardUpdateData = {
          isInside: true,
          lastBusId: payload.busId,
          balance: { decrement: payload.amount },
        };
      } else if (payload.type === TransactionTypeValue.OUT) {
        cardUpdateData = {
          isInside: false,
          ...(payload.amount > 0 ? { balance: { decrement: payload.amount } } : {}),
        };
      } else if (payload.type === TransactionTypeValue.PENALTY) {
        cardUpdateData = {
          balance: { decrement: payload.amount },
        };
      }

      await tx.card.update({
        where: { id: card.id },
        data: cardUpdateData,
      });

      // 3. Update Bus passenger counts
      if (payload.type === TransactionTypeValue.IN) {
        await tx.bus.update({
          where: { id: payload.busId },
          data: {
            passengerCount: { increment: 1 },
          },
        });
      } else if (payload.type === TransactionTypeValue.OUT) {
        const currentBus = await tx.bus.findUnique({
          where: { id: payload.busId },
          select: { passengerCount: true },
        });
        const count = currentBus?.passengerCount ?? 0;
        await tx.bus.update({
          where: { id: payload.busId },
          data: {
            passengerCount: Math.max(0, count - 1),
          },
        });
      }

      return transaction;
    });

    return ApiResponses.success(res, result, { status: 201 });
  } catch (error) {
    return ApiResponses.error(res, {
      status: 500,
      errors: [
        {
          key: "INTERNAL_SERVER_ERROR",
          message: "Terjadi kesalahan saat menambahkan transaksi",
        },
      ],
    });
  }
}
