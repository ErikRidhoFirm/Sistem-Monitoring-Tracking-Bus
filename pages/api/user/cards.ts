import { ApiErrorItem, ApiResponses } from "@/lib/api-response";
import { getSessionFromRequest } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const linkCardSchema = z.object({
  rfidTag: z.string().trim().min(1, "RFID Tag wajib diisi"),
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
  if (req.method !== "GET" && req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", "GET, POST, DELETE");
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

  if (req.method === "GET") {
    const card = await prisma.card.findFirst({
      where: { userId: session.user.id },
      select: {
        rfidTag: true,
        balance: true,
        status: true,
      },
    });

    return ApiResponses.success(res, { card });
  }

  if (req.method === "POST") {
    const parseBody = linkCardSchema.safeParse(req.body);

    if (!parseBody.success) {
      return ApiResponses.error(res, {
        status: 400,
        errors: getValidationErrors(parseBody.error),
      });
    }

    const payload = parseBody.data;

    const existingCard = await prisma.card.findFirst({
      where: { userId: session.user.id },
      select: { rfidTag: true },
    });

    if (existingCard) {
      return ApiResponses.error(res, {
        status: 409,
        errors: [
          {
            key: "CARD_LIMIT_REACHED",
            message: "Hanya satu kartu RFID yang dapat terhubung ke akun ini.",
          },
        ],
      });
    }

    const card = await prisma.card.findUnique({
      where: { rfidTag: payload.rfidTag },
      select: {
        rfidTag: true,
        balance: true,
        status: true,
        userId: true,
      },
    });

    if (card) {
      if (card.userId) {
        return ApiResponses.error(res, {
          status: 409,
          errors: [
            {
              key: "CARD_ALREADY_LINKED",
              message: "Kartu RFID ini sudah terhubung dengan akun lain.",
            },
          ],
        });
      }

      const updatedCard = await prisma.card.update({
        where: { rfidTag: payload.rfidTag },
        data: { userId: session.user.id },
      });

      return ApiResponses.success(res, {
        rfidTag: updatedCard.rfidTag,
        balance: updatedCard.balance,
        status: updatedCard.status,
      });
    }

    const createdCard = await prisma.card.create({
      data: {
        rfidTag: payload.rfidTag,
        balance: 0,
        status: "active",
        userId: session.user.id,
      },
      select: {
        rfidTag: true,
        balance: true,
        status: true,
      },
    });

    return ApiResponses.success(res, createdCard, {
      status: 201,
    });
  }

  const linkedCard = await prisma.card.findFirst({
    where: { userId: session.user.id },
    select: {
      rfidTag: true,
    },
  });

  if (!linkedCard) {
    return ApiResponses.error(res, {
      status: 404,
      errors: [
        {
          key: "CARD_NOT_FOUND",
          message: "Tidak ada kartu RFID yang terhubung dengan akun ini.",
        },
      ],
    });
  }

  await prisma.card.update({
    where: { rfidTag: linkedCard.rfidTag },
    data: { userId: null },
  });

  return ApiResponses.success(res, { rfidTag: linkedCard.rfidTag });
}
