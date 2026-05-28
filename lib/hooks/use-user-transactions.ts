import { useQuery } from "@tanstack/react-query";

import { requestApi } from "@/lib/api-client";
import { TransactionTypeValue } from "@/types/transaction-type";

type UserTransactionItem = {
  id: string;
  type: TransactionTypeValue;
  amount: number;
  latTap: number | null;
  lngTap: number | null;
  createdAt: string;
  rfidTag: string;
  stationName: string | null;
  bus: {
    busCode: string;
    plateNumber: string;
  };
};

type UserTransactionsListPayload = {
  transactions: UserTransactionItem[];
  total: number;
};

const userTransactionKeys = {
  all: ["user", "transactions"] as const,
  list: (
    search: string,
    type: TransactionTypeValue | "ALL",
    page: number,
    limit: number
  ) => ["user", "transactions", "list", search, type, page, limit] as const,
};

export function useUserTransactions(
  search: string,
  type: TransactionTypeValue | "ALL",
  page: number,
  limit = 10
) {
  return useQuery({
    queryKey: userTransactionKeys.list(search, type, page, limit),
    queryFn: () => {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (type !== "ALL") {
        params.set("type", type);
      }

      if (page > 1) {
        params.set("page", page.toString());
      }

      params.set("limit", limit.toString());

      const query = params.toString();
      const url = query ? `/api/user/transactions?${query}` : "/api/user/transactions";

      return requestApi<UserTransactionsListPayload>(url);
    },
  });
}
