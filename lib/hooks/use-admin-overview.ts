import { useQuery } from "@tanstack/react-query";

import { requestApi } from "@/lib/api-client";

type AdminOverview = {
  users: number;
  buses: number;
  activeBuses: number;
  inactiveBuses: number;
  routes: number;
  stations: number;
  devices: number;
  cards: number;
  activeCards: number;
  transactions: number;
  totalPassengerCount: number;
  uptimeSeconds: number;
};

export function useAdminOverview() {
  return useAdminOverviewByBus("ALL");
}

export function useAdminOverviewByBus(busId: string | "ALL") {
  return useQuery({
    queryKey: ["admin", "overview", busId],
    queryFn: () => {
      const params = new URLSearchParams();

      if (busId !== "ALL") {
        params.set("busId", busId);
      }

      const query = params.toString();
      const url = query ? `/api/admin/overview?${query}` : "/api/admin/overview";

      return requestApi<AdminOverview>(url, { cache: "no-store" });
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    enabled: true,
    retry: 2,
  });
}
