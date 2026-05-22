import { ApiResponses } from "@/lib/api-response";
import { getSessionFromRequest, isAdminRole } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const profitSummaryQuerySchema = z.object({
  busId: z.string().trim().min(1).optional(),
});

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const start = new Date(date);
  start.setDate(date.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

async function sumProfit(where: Record<string, unknown>) {
  const aggregate = await prisma.transaction.aggregate({
    where,
    _sum: {
      amount: true,
    },
  });

  return aggregate._sum.amount ?? 0;
}

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

  const parseQuery = profitSummaryQuerySchema.safeParse({
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

  const now = new Date();
  const busId = parseQuery.data.busId;
  const busFilter = busId ? { busId } : {};

  const [dailyProfit, weeklyProfit, monthlyProfit] = await Promise.all([
    sumProfit({
      ...busFilter,
      createdAt: {
        gte: startOfDay(now),
      },
    }),
    sumProfit({
      ...busFilter,
      createdAt: {
        gte: startOfWeek(now),
      },
    }),
    sumProfit({
      ...busFilter,
      createdAt: {
        gte: startOfMonth(now),
      },
    }),
  ]);

  return ApiResponses.success(res, {
    busId: busId ?? null,
    dailyProfit,
    weeklyProfit,
    monthlyProfit,
  });
}
