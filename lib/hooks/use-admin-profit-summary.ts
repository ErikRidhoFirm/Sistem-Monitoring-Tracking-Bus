import { useQuery } from "@tanstack/react-query";

import { requestApi } from "@/lib/api-client";

export type AdminProfitSummary = {
  busId: string | null;
  dailyProfit: number;
  weeklyProfit: number;
  monthlyProfit: number;
  yearlyProfit: number;
};

const profitSummaryKeys = {
  all: ["admin", "profit-summary"] as const,
  bus: (busId: string | "ALL") => ["admin", "profit-summary", busId] as const,
};

export function useAdminProfitSummary(busId: string | "ALL") {
  return useQuery({
    queryKey: profitSummaryKeys.bus(busId),
    queryFn: () => {
      const params = new URLSearchParams();

      if (busId !== "ALL") {
        params.set("busId", busId);
      }

      const query = params.toString();
      const url = query ? `/api/admin/profit-summary?${query}` : "/api/admin/profit-summary";

      return requestApi<AdminProfitSummary>(url, { cache: "no-store" });
    },
    // Always treat data as stale so switching bus filter triggers a fresh fetch.
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 60 * 1000,
    retry: 2,
  });
}
