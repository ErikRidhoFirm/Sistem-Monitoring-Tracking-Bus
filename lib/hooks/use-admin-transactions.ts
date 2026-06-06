import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { requestApi } from "@/lib/api-client";
import { TransactionTypeValue } from "@/types/transaction-type";

export type TransactionItem = {
  id: string;
  type: TransactionTypeValue;
  amount: number;
  latTap: number | null;
  lngTap: number | null;
  createdAt: string;
  rfidTag: string;
  busId: string;
  stationName: string | null;
  card: {
    rfidTag: string;
    user?: {
      id: string;
      name: string | null;
      email: string | null;
    } | null;
  };
  bus: {
    id: string;
    busCode: string;
    plateNumber: string;
  };
};

type TransactionPayload = {
  type: TransactionTypeValue;
  amount: number;
  rfidTag: string;
  busId: string;
  stationName?: string;
  latTap?: number;
  lngTap?: number;
};

type TransactionsListPayload = {
  transactions: TransactionItem[];
  cards: Array<{ rfidTag: string }>;
  buses: Array<{ id: string; busCode: string; plateNumber: string }>;
  types: TransactionTypeValue[];
};

const transactionKeys = {
  all: ["admin", "transactions"] as const,
  list: (search: string, type: TransactionTypeValue | "ALL") =>
    ["admin", "transactions", "list", search, type] as const,
};

export function useAdminTransactions(
  search: string,
  type: TransactionTypeValue | "ALL",
  page: number = 1,
  limit: number = 10,
  userLinkFilter: "ALL" | "LINKED" | "UNLINKED" = "ALL",
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: ["admin", "transactions", "list", search, type, page, limit, userLinkFilter, startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (type !== "ALL") {
        params.set("type", type);
      }

      params.set("page", page.toString());
      params.set("limit", limit.toString());
      params.set("userLinkFilter", userLinkFilter);

      if (startDate) {
        params.set("startDate", startDate);
      }
      if (endDate) {
        params.set("endDate", endDate);
      }

      const query = params.toString();
      const url = `/api/admin/transactions?${query}`;

      return requestApi<{
        transactions: TransactionItem[];
        total: number;
      }>(url);
    },
  });
}

export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TransactionPayload) =>
      requestApi<TransactionItem>("/api/admin/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: transactionKeys.all,
      });
    },
  });
}

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      requestApi<{ id: string }>(`/api/admin/transactions/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: transactionKeys.all,
      });
    },
  });
}
