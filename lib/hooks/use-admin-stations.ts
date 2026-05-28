import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { requestApi } from "@/lib/api-client";

export type StationItem = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
};

type StationsListPayload = {
  stations: StationItem[];
  total?: number;
};

type StationPayload = {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
};

const stationsKeys = {
  all: ["admin", "stations"] as const,
  list: (search: string, page?: number, limit?: number) =>
    ["admin", "stations", "list", { search, page, limit }] as const,
};

export function useAdminStations(search: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: stationsKeys.list(search, page, limit),
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }
      if (page !== undefined) {
        params.set("page", page.toString());
      }
      if (limit !== undefined) {
        params.set("limit", limit.toString());
      }

      const query = params.toString();
      const url = query ? `/api/admin/stations?${query}` : "/api/admin/stations";

      return requestApi<StationsListPayload>(url);
    },
  });
}

export function useCreateStationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StationPayload) =>
      requestApi<StationItem>("/api/admin/stations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: stationsKeys.all,
      });
    },
  });
}

export function useUpdateStationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StationPayload }) =>
      requestApi<StationItem>(`/api/admin/stations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: stationsKeys.all,
      });
    },
  });
}

export function useDeleteStationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      requestApi<{ id: string }>(`/api/admin/stations/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: stationsKeys.all,
      });
    },
  });
}
