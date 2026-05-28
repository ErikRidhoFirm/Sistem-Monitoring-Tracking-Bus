import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { DeviceStatus } from "@/generated/prisma";
import { requestApi } from "@/lib/api-client";

export type { DeviceStatus };

export type BusOption = {
  id: string;
  busCode: string;
  plateNumber: string;
  isActive: boolean;
};

export type DeviceAssignment = {
  id: string;
  assignedAt: string;
  unassignedAt: string | null;
  bus: {
    id: string;
    busCode: string;
    plateNumber: string;
  };
};

export type IotDeviceItem = {
  id: string;
  serialNumber: string;
  deviceKeyHash: string;
  status: DeviceStatus;
  firmwareVer: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
  currentBusId: string | null;
  currentBus: BusOption | null;
  assignments: DeviceAssignment[];
};

type IotDevicesPayload = {
  devices: IotDeviceItem[];
  buses: BusOption[];
  total?: number;
  stats?: {
    totalDevices: number;
    activeDevices: number;
    assignedDevices: number;
    onlineDevices: number;
  };
};

type IotDeviceCreatePayload = {
  serialNumber: string;
  deviceKey: string;
  status: DeviceStatus;
  firmwareVer?: string | null;
  currentBusId?: string | null;
};

type IotDeviceUpdatePayload = {
  serialNumber?: string;
  deviceKey?: string;
  status?: DeviceStatus;
  firmwareVer?: string | null;
  currentBusId?: string | null;
};

const iotDeviceKeys = {
  all: ["admin", "iot-devices"] as const,
  list: (search: string, page?: number, limit?: number, status?: string) =>
    ["admin", "iot-devices", "list", { search, page, limit, status }] as const,
};

export function useAdminIotDevices(
  search: string,
  page?: number,
  limit?: number,
  status?: string,
) {
  return useQuery({
    queryKey: iotDeviceKeys.list(search, page, limit, status),
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
      if (status !== undefined && status !== "ALL") {
        params.set("status", status);
      }

      const query = params.toString();
      const url = query
        ? `/api/admin/iot-devices?${query}`
        : "/api/admin/iot-devices";

      return requestApi<IotDevicesPayload>(url);
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateIotDeviceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IotDeviceCreatePayload) =>
      requestApi<IotDeviceItem>("/api/admin/iot-devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: iotDeviceKeys.all,
      });
    },
  });
}

export function useUpdateIotDeviceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: IotDeviceUpdatePayload;
    }) =>
      requestApi<IotDeviceItem>(`/api/admin/iot-devices/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: iotDeviceKeys.all,
      });
    },
  });
}

export function useDeleteIotDeviceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      requestApi<{ id: string }>(`/api/admin/iot-devices/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: iotDeviceKeys.all,
      });
    },
  });
}
