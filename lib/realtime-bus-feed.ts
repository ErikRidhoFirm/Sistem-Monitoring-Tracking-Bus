export type Coordinate = [number, number];

export type BusTelemetryStatus = "IN_TRANSIT" | "NEAR_ARRIVAL";

export type BusTelemetry = {
  busId: string;
  busCode?: string;
  busStatusLabel?: string;
  position: Coordinate;
  nearestStop: string;
  etaMinutes: number;
  speedKph: number;
  speed?: number;
  datetime?: string;
  passengerCount: number;
  maxPassengers?: number;
  status: BusTelemetryStatus;
  timestamp: number;
};

export type FeedContext = {
  routeCoordinates: Coordinate[];
  stopNames: string[];
  routeStops?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    order: number;
  }>;
  loopDurationSeconds?: number;
  busCount?: number;
};

export type RealtimeFeedCallback = (payload: BusTelemetry) => void;
export type RealtimeFeedUnsubscribe = () => void;
export type RealtimeFeedStatus = "connected" | "connecting" | "disconnected";

export interface RealtimeFeedAdapter {
  connect(
    onMessage: RealtimeFeedCallback,
    context: FeedContext,
  ): RealtimeFeedUnsubscribe;
}

type WebSocketCoordinateItem = {
  id?: number | string;
  imei?: string;
  bus_number?: string;
  plate_number?: string;
  longitude?: number;
  latitude?: number;
  status?: string;
  bus_status?: string;
  nearest_stop?: string;
  speed?: number;
  gps_time?: string;
  current_halte?: string;
  message?: string;
  passenger_count?: number;
  max_passengers?: number;
};

type WebSocketPayload = {
  coordinates?: WebSocketCoordinateItem[];
  operationalStatus?: number;
};

function toFiniteNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function createWebSocketBusFeed(input: {
  wsUrl?: string;
  onStatusChange?: (status: RealtimeFeedStatus) => void;
}): RealtimeFeedAdapter {
  return {
    connect(onMessage) {
      if (typeof window === "undefined") {
        return () => undefined;
      }

      const wsUrl = input.wsUrl;
      if (!wsUrl) {
        input.onStatusChange?.("disconnected");
        console.error("Realtime WS URL is not configured.");
        return () => undefined;
      }

      let socket: WebSocket | null = null;
      let isClosing = false;

      const openSocket = () => {
        input.onStatusChange?.("connecting");
        socket = new WebSocket(wsUrl);

        socket.addEventListener("open", () => {
          input.onStatusChange?.("connected");
        });

        socket.addEventListener("close", () => {
          if (!isClosing) {
            input.onStatusChange?.("disconnected");
          }
        });

        socket.addEventListener("error", () => {
          if (!isClosing) {
            input.onStatusChange?.("disconnected");
          }
        });

        socket.addEventListener("message", (event) => {
          if (isClosing) {
            return;
          }

          try {
            console.log("[realtime-ws] raw-message", event.data);
            const payload = JSON.parse(String(event.data)) as WebSocketPayload;
            const items = payload.coordinates ?? [];
            console.log("[realtime-ws] parsed-payload", payload);
            if (!Array.isArray(items) || items.length === 0) {
              return;
            }

            const now = Date.now();
            items.forEach((item) => {
              const lat = Number(item.latitude);
              const lng = Number(item.longitude);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return;
              }

              const busId =
                item.imei ||
                (item.id != null ? String(item.id) : "") ||
                item.bus_number ||
                item.plate_number ||
                "unknown";

              const position: Coordinate = [lng, lat];
              const speed = Number(item.speed ?? 0);
              const speedKph = Number.isFinite(speed) ? speed : 0;
              const nearestStop =
                item.nearest_stop ||
                (item.current_halte && item.current_halte.trim().length > 0
                  ? item.current_halte
                  : "-");
              const busStatus = item.bus_status || item.status || "In Transit";
              const normalizedStatus: BusTelemetryStatus =
                busStatus.toLowerCase().startsWith("arrived")
                  ? "NEAR_ARRIVAL"
                  : "IN_TRANSIT";
              const passengerCount = toFiniteNumber(item.passenger_count) ?? 0;
              const maxPassengers = toFiniteNumber(item.max_passengers);

              onMessage({
                busId,
                busCode:
                  item.bus_number || item.plate_number || item.imei || busId,
                busStatusLabel: busStatus,
                position,
                nearestStop,
                etaMinutes: 0,
                speedKph,
                speed: Number.isFinite(speed) ? speed : undefined,
                datetime: item.gps_time,
                passengerCount,
                maxPassengers,
                status: normalizedStatus,
                timestamp: now,
              });

              console.log("[realtime-ws] telemetry", {
                busId,
                busCode: item.bus_number || item.plate_number || item.imei,
                latitude: lat,
                longitude: lng,
                speed,
                gpsTime: item.gps_time,
                nearestStop,
                busStatus,
                passengerCount,
                maxPassengers,
                receivedAt: new Date(now).toISOString(),
              });
            });
          } catch (err) {
            console.error("Failed to parse WebSocket payload:", err);
          }
        });
      };

      openSocket();

      return () => {
        isClosing = true;
        if (socket) {
          socket.close();
        }
      };
    },
  };
}

export function createRealtimeBusFeed(input: {
  wsUrl?: string;
  onStatusChange?: (status: RealtimeFeedStatus) => void;
}): RealtimeFeedAdapter {
  const normalizedWsUrl =
    input.wsUrl && input.wsUrl.trim().length > 0
      ? input.wsUrl
      : typeof window !== "undefined"
        ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`
        : undefined;

  return createWebSocketBusFeed({
    wsUrl: normalizedWsUrl,
    onStatusChange: input.onStatusChange,
  });
}
