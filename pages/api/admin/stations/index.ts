import { ApiErrorItem, ApiResponses } from "@/lib/api-response";
import { getSessionFromRequest, isAdminRole } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const listStationsQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
});

const createStationSchema = z.object({
  name: z.string().trim().min(1, "Nama halte wajib diisi"),
  latitude: z
    .number({ message: "Latitude wajib diisi" })
    .min(-90, "Latitude minimal -90")
    .max(90, "Latitude maksimal 90"),
  longitude: z
    .number({ message: "Longitude wajib diisi" })
    .min(-180, "Longitude minimal -180")
    .max(180, "Longitude maksimal 180"),
  radius: z.number({ message: "Radius wajib diisi" }).int().positive(),
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

  if (req.method === "GET") {
    const parseQuery = listStationsQuerySchema.safeParse({
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });

    if (!parseQuery.success) {
      return ApiResponses.error(res, {
        status: 400,
        errors: getValidationErrors(parseQuery.error),
      });
    }

    const search = parseQuery.data.search?.trim();
    const page = parseQuery.data.page;
    const limit = parseQuery.data.limit;

    const whereClause = search
      ? {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : undefined;

    const [stations, total] = await prisma.$transaction([
      prisma.station.findMany({
        where: whereClause,
        orderBy: {
          name: "asc",
        },
        skip: page && limit ? (page - 1) * limit : undefined,
        take: limit || undefined,
      }),
      prisma.station.count({
        where: whereClause,
      }),
    ]);

    return ApiResponses.success(
      res,
      {
        stations,
        total,
      },
      {
        meta: {
          total,
          page: page ?? 1,
          limit: limit ?? total,
        },
      },
    );
  }

  const parseBody = createStationSchema.safeParse(req.body);

  if (!parseBody.success) {
    return ApiResponses.error(res, {
      status: 400,
      errors: getValidationErrors(parseBody.error),
    });
  }

  const station = await prisma.station.create({
    data: parseBody.data,
  });

  return ApiResponses.success(res, station, { status: 201 });
}
