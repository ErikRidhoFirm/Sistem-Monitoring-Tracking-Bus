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
  return useQuery({
    queryKey: ["admin", "today-transactions", limit],
    queryFn: () =>
      requestApi<TodayTransactionsResponse>(
        `/api/admin/transactions/recent?limit=${encodeURIComponent(limit)}`,
      ),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 2,
  });
}
