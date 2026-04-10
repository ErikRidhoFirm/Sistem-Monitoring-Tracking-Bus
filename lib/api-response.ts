import { NextApiResponse } from "next";

export type ApiErrorItem = {
  key?: string;
  field?: string;
  message: string;
};

export type ApiMeta = {
  [key: string]: unknown;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
  errors?: undefined;
};

export type ApiErrorResponse = {
  success: false;
  data: null;
  meta?: ApiMeta;
  errors: ApiErrorItem[];
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiResponses {
  static success<T>(
    res: NextApiResponse<ApiResponse<T>>,
    data: T,
    options?: {
      status?: number;
      meta?: ApiMeta;
    },
  ) {
    const status = options?.status ?? 200;
    return res.status(status).json({
      success: true,
      data,
      meta: options?.meta,
    });
  }

  static error(
    res: NextApiResponse<ApiResponse<never>>,
    options: {
      status: number;
      errors: ApiErrorItem[];
      meta?: ApiMeta;
    },
  ) {
    return res.status(options.status).json({
      success: false,
      data: null,
      meta: options.meta,
      errors: options.errors,
    });
  }
}
