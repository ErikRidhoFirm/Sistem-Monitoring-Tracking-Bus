import { Prisma } from "@/generated/prisma/client";
import { ApiErrorItem, ApiResponses } from "@/lib/api-response";
import { getSessionFromRequest, isAdminRole } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const listBusesQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).optional().default("ALL"),
});

const createBusSchema = z.object({
  busCode: z.string().trim().min(1, "Kode bus wajib diisi"),
  plateNumber: z.string().trim().min(1, "Nomor polisi wajib diisi"),
  isActive: z.boolean().optional().default(true),
  price: z.coerce.number().int().min(0).optional().default(2500),
  maxPassengers: z.coerce
    .number()
    .int()
    .min(1, "Kapasitas maksimal minimal 1")
    .optional()
    .default(50),
  routeId: z.string().trim().min(1).optional().nullable(),
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
    const parseQuery = listBusesQuerySchema.safeParse({
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
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
    const status = parseQuery.data.status;

    const whereClause: Prisma.BusWhereInput = {
      AND: [],
    };

    if (search) {
      whereClause.AND = [
        ...(whereClause.AND as Prisma.BusWhereInput[]),
        {
          OR: [
            {
              busCode: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              plateNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              route: {
                routeName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          ],
        },
      ];
    }

    if (status && status !== "ALL") {
      whereClause.AND = [
        ...(whereClause.AND as Prisma.BusWhereInput[]),
        {
          isActive: status === "ACTIVE",
        },
      ];
    }

    const finalWhere = (whereClause.AND as any[]).length > 0 ? whereClause : undefined;

    const [buses, total, routes] = await prisma.$transaction([
      prisma.bus.findMany({
        where: finalWhere,
        include: {
          route: {
            select: {
              id: true,
              routeName: true,
            },
          },
        },
        orderBy: {
          busCode: "asc",
        },
        skip: page && limit ? (page - 1) * limit : undefined,
        take: limit || undefined,
      }),
      prisma.bus.count({
        where: finalWhere,
      }),
      prisma.route.findMany({
        select: {
          id: true,
          routeName: true,
        },
        orderBy: {
          routeName: "asc",
        },
      }),
    ]);

    // Calculate aggregated overall database stats for summary cards
    const [totalBuses, activeCount, passengerAggregation] = await Promise.all([
      prisma.bus.count(),
      prisma.bus.count({ where: { isActive: true } }),
      prisma.bus.aggregate({
        _sum: {
          passengerCount: true,
        },
      }),
    ]);

    const inactiveCount = totalBuses - activeCount;
    const totalPassengers = passengerAggregation._sum.passengerCount ?? 0;

    return ApiResponses.success(
      res,
      {
        buses,
        routes,
        total,
        stats: {
          totalBuses,
          activeCount,
          inactiveCount,
          totalPassengers,
        },
      },
      {
        meta: {
          total,
          page: page ?? 1,
          limit: limit ?? totalBuses,
        },
      },
    );
  }

  const parseBody = createBusSchema.safeParse(req.body);

  if (!parseBody.success) {
    return ApiResponses.error(res, {
      status: 400,
      errors: getValidationErrors(parseBody.error),
    });
  }

  const payload = parseBody.data;

  if (payload.routeId) {
    const route = await prisma.route.findUnique({
      where: { id: payload.routeId },
    });
    if (!route) {
      return ApiResponses.error(res, {
        status: 400,
        errors: [
          {
            key: "VALIDATION_ERROR",
            field: "routeId",
            message: "Rute tidak ditemukan",
          },
        ],
      });
    }
  }

  try {
    const bus = await prisma.bus.create({
      data: {
        busCode: payload.busCode,
        plateNumber: payload.plateNumber,
        isActive: payload.isActive,
        price: payload.price,
        maxPassengers: payload.maxPassengers,
        routeId: payload.routeId ?? undefined,
      },
      include: {
        route: {
          select: {
            id: true,
            routeName: true,
          },
        },
      },
    });

    return ApiResponses.success(res, bus, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return ApiResponses.error(res, {
        status: 409,
        errors: [
          {
            key: "CONFLICT",
            field: "busCode",
            message: "Kode bus sudah terdaftar",
          },
        ],
      });
    }

    return ApiResponses.error(res, {
      status: 500,
      errors: [
        {
          key: "INTERNAL_SERVER_ERROR",
          message: "Terjadi kesalahan saat membuat bus",
        },
      ],
    });
  }
}
