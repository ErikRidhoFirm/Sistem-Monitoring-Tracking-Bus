import { useQuery } from "@tanstack/react-query";
import { requestApi } from "@/lib/api-client";
import { TransactionTypeValue } from "@/types/transaction-type";

type TodayTransactionItem = {
  id: string;
  type: TransactionTypeValue;
  amount: number;
  latTap: number | null;
  lngTap: number | null;
  createdAt: string;
  rfidTag: string;
  stationName: string | null;
  card: {
    rfidTag: string;
    user: { id: string; name: string | null; email: string } | null;
  };
  bus: {
    id: string;
    busCode: string;
    plateNumber: string;
  };
};

type TodayTransactionsResponse = {
  transactions: TodayTransactionItem[];
};

export function useAdminTodayTransactions(limit = 5) {
  return useAdminTodayTransactionsByBus(limit, "ALL");
}

export function useAdminTodayTransactionsByBus(limit = 5, busId: string | "ALL" = "ALL") {
  return useQuery({
    queryKey: ["admin", "today-transactions", limit, busId],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));

      if (busId !== "ALL") {
        params.set("busId", busId);
      }

      return requestApi<TodayTransactionsResponse>(
        `/api/admin/transactions/recent?${params.toString()}`,
        { cache: "no-store" },
      );
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 60 * 1000,
    retry: 2,
  });
}
