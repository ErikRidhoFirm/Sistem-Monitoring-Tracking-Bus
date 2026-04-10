// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { ApiResponses } from "@/lib/api-response";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return ApiResponses.success<Data>(res, { name: "John Doe" });
}
