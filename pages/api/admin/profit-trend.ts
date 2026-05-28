import { ApiResponses } from "@/lib/api-response";
import { getSessionFromRequest, isAdminRole } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const profitTrendQuerySchema = z.object({
  busId: z.string().trim().min(1).optional(),
  period: z.enum(["weekly", "monthly", "yearly"]).default("weekly"),
});

const weekLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"] as const;

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

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

type TrendPoint = {
  label: string;
  profit: number;
};

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

  if (!isAdminRole(session.user.role)) {
    return ApiResponses.error(res, {
      status: 403,
      errors: [{ key: "FORBIDDEN", message: "Forbidden" }],
    });
  }

  const parseQuery = profitTrendQuerySchema.safeParse({
    busId: req.query.busId,
    period: req.query.period,
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
  const { busId, period } = parseQuery.data;

  const rangeStart =
    period === "weekly" ? startOfWeek(now) : period === "monthly" ? startOfMonth(now) : startOfYear(now);

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(busId ? { busId } : {}),
      createdAt: {
        gte: rangeStart,
        lte: now,
      },
    },
    select: {
      amount: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  let points: TrendPoint[] = [];

  if (period === "weekly") {
    const currentWeeklyIndex = (now.getDay() + 6) % 7;
    points = weekLabels.slice(0, currentWeeklyIndex + 1).map((label) => ({ label, profit: 0 }));

    for (const transaction of transactions) {
      const dayIndex = (transaction.createdAt.getDay() + 6) % 7;
      if (dayIndex >= 0 && dayIndex < points.length) {
        points[dayIndex].profit += transaction.amount;
      }
    }
  } else if (period === "monthly") {
    const currentWeekIndex = Math.min(4, Math.ceil(now.getDate() / 7) - 1);
    points = Array.from({ length: currentWeekIndex + 1 }, (_, index) => ({
      label: `Minggu ${index + 1}`,
      profit: 0,
    }));

    for (const transaction of transactions) {
      const weekIndex = Math.min(4, Math.ceil(transaction.createdAt.getDate() / 7) - 1);
      if (weekIndex >= 0 && weekIndex < points.length) {
        points[weekIndex].profit += transaction.amount;
      }
    }
  } else {
    const currentMonthIndex = now.getMonth();
    points = monthLabels.slice(0, currentMonthIndex + 1).map((label) => ({ label, profit: 0 }));

    for (const transaction of transactions) {
      const monthIndex = transaction.createdAt.getMonth();
      if (monthIndex >= 0 && monthIndex < points.length) {
        points[monthIndex].profit += transaction.amount;
      }
    }
  }

  return ApiResponses.success(res, {
    busId: busId ?? null,
    period,
    points,
  });
}
