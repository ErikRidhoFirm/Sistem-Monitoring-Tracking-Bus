import { useQuery } from "@tanstack/react-query";

import { requestApi } from "@/lib/api-client";

export type ProfitTrendPeriod = "weekly" | "monthly" | "yearly";

type ProfitTrendPoint = {
  label: string;
  profit: number;
};

export type AdminProfitTrend = {
  busId: string | null;
  period: ProfitTrendPeriod;
  points: ProfitTrendPoint[];
};

const profitTrendKeys = {
  all: ["admin", "profit-trend"] as const,
  scope: (busId: string | "ALL", period: ProfitTrendPeriod) =>
    ["admin", "profit-trend", busId, period] as const,
};

export function useAdminProfitTrend(busId: string | "ALL", period: ProfitTrendPeriod) {
  return useQuery({
    queryKey: profitTrendKeys.scope(busId, period),
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("period", period);

      if (busId !== "ALL") {
        params.set("busId", busId);
      }

      return requestApi<AdminProfitTrend>(`/api/admin/profit-trend?${params.toString()}`, { cache: "no-store" });
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}
