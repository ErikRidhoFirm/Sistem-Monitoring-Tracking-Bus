import { ApiResponses } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { NextApiRequest, NextApiResponse } from "next";

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

  const headers = new Headers();
  if (req.headers.cookie) {
    headers.set("cookie", req.headers.cookie);
  }

  const session = await auth.api.getSession({
    headers,
  });

  if (!session?.user) {
    return ApiResponses.error(res, {
      status: 401,
      errors: [{ key: "UNAUTHORIZED", message: "Unauthorized" }],
    });
  }

  return ApiResponses.success(res, session.user);
}
