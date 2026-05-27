import { ApiResponses } from "@/lib/api-response";
import { getSessionFromRequest, isAdminRole } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
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

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return ApiResponses.error(res, {
      status: 400,
      errors: [
        {
          key: "VALIDATION_ERROR",
          field: "id",
          message: "Transaction ID tidak valid",
        },
      ],
    });
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return ApiResponses.error(res, {
        status: 404,
        errors: [
          {
            key: "NOT_FOUND",
            message: "Transaksi tidak ditemukan",
          },
        ],
      });
    }

    await prisma.$transaction(async (tx) => {
      // Revert card balance and isInside status if card still exists
      const cardExists = await tx.card.findUnique({
        where: { rfidTag: transaction.rfidTag },
      });

      if (cardExists) {
        let cardUpdateData: any = {
          balance: { increment: transaction.amount },
        };

        if (transaction.type === "IN") {
          cardUpdateData.isInside = false;
          cardUpdateData.lastBusId = null;
        } else if (transaction.type === "OUT") {
          cardUpdateData.isInside = true;
          cardUpdateData.lastBusId = transaction.busId;
        }

        await tx.card.update({
          where: { rfidTag: transaction.rfidTag },
          data: cardUpdateData,
        });
      }

      // Revert bus passenger count if bus still exists
      const busExists = await tx.bus.findUnique({
        where: { id: transaction.busId },
        select: { id: true, passengerCount: true },
      });

      if (busExists) {
        if (transaction.type === "IN") {
          await tx.bus.update({
            where: { id: transaction.busId },
            data: {
              passengerCount: Math.max(0, busExists.passengerCount - 1),
            },
          });
        } else if (transaction.type === "OUT") {
          await tx.bus.update({
            where: { id: transaction.busId },
            data: {
              passengerCount: busExists.passengerCount + 1,
            },
          });
        }
      }

      // Delete transaction
      await tx.transaction.delete({
        where: { id },
      });
    });

    return ApiResponses.success(res, { id }, { message: "Transaksi berhasil dihapus" });
  } catch (error) {
    return ApiResponses.error(res, {
      status: 500,
      errors: [
        {
          key: "INTERNAL_SERVER_ERROR",
          message: "Terjadi kesalahan saat menghapus transaksi",
        },
      ],
    });
  }
}
