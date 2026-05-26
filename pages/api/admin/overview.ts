import { ApiResponses } from "@/lib/api-response";
import { getSessionFromRequest, isAdminRole } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const overviewQuerySchema = z.object({
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

  const parseQuery = overviewQuerySchema.safeParse({
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

  const { busId } = parseQuery.data;

  if (!busId) {
    const [
      users,
      buses,
      routes,
      stations,
      devices,
      cards,
      activeCards,
      transactions,
      activeBuses,
      passengerAggregate,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.bus.count(),
      prisma.route.count(),
      prisma.station.count(),
      prisma.iotDevice.count(),
      prisma.card.count(),
      prisma.card.count({ where: { status: "active" } }),
      prisma.transaction.count(),
      prisma.bus.count({ where: { isActive: true } }),
      prisma.bus.aggregate({ _sum: { passengerCount: true } }),
    ]);

    const inactiveBuses = buses - activeBuses;
    const totalPassengerCount = passengerAggregate._sum.passengerCount ?? 0;
    const uptimeSeconds = Math.floor(process.uptime());

    return ApiResponses.success(res, {
      users,
      buses,
      activeBuses,
      inactiveBuses,
      devices,
      cards,
      activeCards,
      transactions,
      totalPassengerCount,
      uptimeSeconds,
    });
  }

  const [
    users,
    buses,
    routes,
    stations,
    devices,
    cards,
    activeCards,
    transactions,
    activeBuses,
    passengerAggregate,
  ] = await prisma.$transaction([
    prisma.user.count({ where: { cards: { some: { lastBusId: busId } } } }),
    prisma.bus.count({ where: { id: busId } }),
    prisma.route.count(),
    prisma.station.count(),
    prisma.iotDevice.count({ where: { currentBusId: busId } }),
    prisma.card.count({ where: { lastBusId: busId } }),
    prisma.card.count({ where: { status: "active", lastBusId: busId } }),
    prisma.transaction.count({ where: { busId } }),
    prisma.bus.count({ where: { id: busId, isActive: true } }),
    prisma.bus.aggregate({ where: { id: busId }, _sum: { passengerCount: true } }),
  ]);

  const inactiveBuses = buses - activeBuses;
  const totalPassengerCount = passengerAggregate._sum.passengerCount ?? 0;
  const uptimeSeconds = Math.floor(process.uptime());

  return ApiResponses.success(res, {
    users,
    buses,
    activeBuses,
    inactiveBuses,
    devices,
    cards,
    activeCards,
    transactions,
    totalPassengerCount,
    uptimeSeconds,
  });
}
