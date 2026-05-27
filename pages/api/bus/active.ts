import type { NextApiRequest, NextApiResponse } from "next";

import { ApiResponses } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return ApiResponses.error(res, {
      message: "Method not allowed",
      errors: [
        { key: "METHOD_NOT_ALLOWED", message: "Only GET method is allowed" },
      ],
      status: 405,
    });
  }

  const buses = await prisma.bus.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      busCode: true,
      passengerCount: true,
      maxPassengers: true,
    },
    orderBy: {
      busCode: "asc",
    },
  });

  return ApiResponses.success(res, { buses });
}
