import type { Server } from "http";
import mqtt from "mqtt";
import { WebSocketServer } from "ws";

import { prisma } from "./prisma";

type MqttLocationPayload = {
  busId?: string;
  imei?: string;
  id?: string | number;
  bus_number?: string;
  plate_number?: string;
  lat?: number;
  latitude?: number;
  lng?: number;
  longitude?: number;
  speed?: number;
  datetime?: string;
  gps_time?: string;
  current_halte?: string;
  message?: string;
  next_halte?: string;
  passenger_count?: number;
  passengerCount?: number;
  max_passengers?: number;
  maxPassengers?: number;
};

type MqttBusStatusPayload = {
  busId?: string;
  status?: string;
  stationName?: string;
};

type RealtimeWsPayload = {
  coordinates: Array<{
    id: string;
    imei: string;
    bus_number?: string;
    plate_number?: string;
    longitude: number;
    latitude: number;
    status?: string;
    bus_status?: string;
    nearest_stop?: string;
    speed?: number;
    gps_time?: string;
    current_halte?: string;
    message?: string;
    next_halte?: string;
    passenger_count?: number;
    max_passengers?: number;
  }>;
  operationalStatus: number;
};

type BusIdentity = {
  busId: string;
  imei: string;
  busNumber?: string;
  plateNumber?: string;
  maxPassengers?: number;
};

type BusCapacity = {
  passengerCount?: number;
  maxPassengers?: number;
};

const DEFAULT_TOPIC = "/bus/tracking/location";
const DEFAULT_STATUS_TOPIC = "/bus/tracking/status";

const normalizeTopicPath = (value: string) =>
  value.replace(/\/+$/, "").replace(/^\/+/, "");

export function startRealtimeWsServer(server: Server) {
  const wss = new WebSocketServer({
    noServer: true,
    path: "/ws",
  });

  server.on("upgrade", (request, socket, head) => {
    const requestPath = request.url || "";
    if (!requestPath.startsWith("/ws")) {
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  const brokerUrl =
    process.env.MQTT_BROKER_URL ||
    process.env.NEXT_PUBLIC_MQTT_BROKER_URL ||
    "mqtt://localhost:1883";
  const topic =
    process.env.MQTT_TOPIC ||
    process.env.NEXT_PUBLIC_MQTT_TOPIC ||
    DEFAULT_TOPIC;
  const normalizedTopic = topic.replace(/\/+$/, "");
  const subscriptionTopics = [`${normalizedTopic}/#`];
  const statusTopic = process.env.MQTT_STATUS_TOPIC || DEFAULT_STATUS_TOPIC;
  const normalizedStatusTopic = statusTopic.replace(/\/+$/, "");
  const statusSubscriptionTopics = [`${normalizedStatusTopic}/#`];
  const statusTopicPath = normalizeTopicPath(normalizedStatusTopic);

  const clientOptions: Record<string, unknown> = {
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    clientId: `buswy-realtime-ws-${Math.random().toString(36).slice(2, 10)}`,
  };

  const username =
    process.env.MQTT_USERNAME || process.env.NEXT_PUBLIC_MQTT_USERNAME;
  const password =
    process.env.MQTT_PASSWORD || process.env.NEXT_PUBLIC_MQTT_PASSWORD;
  if (username) {
    clientOptions.username = username;
  }
  if (password) {
    clientOptions.password = password;
  }

  const mqttClient = mqtt.connect(brokerUrl, clientOptions);
  const busIdentityCache = new Map<string, BusIdentity>();
  const statusByBus = new Map<
    string,
    { nearestStop: string; busStatus: string }
  >();

  const toBusStatusLabel = (status?: string, stationName?: string) => {
    if (status === "ARRIVED") {
      return `Arrived At ${stationName || "-"}`;
    }
    return "In Transit";
  };

  const getBusCapacity = async (
    payload: MqttLocationPayload,
    busIdentity: BusIdentity,
  ): Promise<BusCapacity> => {
    const candidateId = payload.busId ? String(payload.busId) : undefined;
    if (!candidateId) {
      return {
        passengerCount: undefined,
        maxPassengers: busIdentity.maxPassengers,
      };
    }

    try {
      const bus = await prisma.bus.findUnique({
        where: { id: candidateId },
        select: {
          passengerCount: true,
          maxPassengers: true,
        },
      });

      return {
        passengerCount: bus?.passengerCount,
        maxPassengers: bus?.maxPassengers ?? busIdentity.maxPassengers,
      };
    } catch (error) {
      console.error("Failed to resolve bus capacity:", error);
      return {
        passengerCount: undefined,
        maxPassengers: busIdentity.maxPassengers,
      };
    }
  };

  const resolveBusIdentity = async (
    payload: MqttLocationPayload,
  ): Promise<BusIdentity> => {
    const candidateId = payload.busId ? String(payload.busId) : undefined;
    const fallbackId =
      payload.imei ||
      (payload.id != null ? String(payload.id) : undefined) ||
      payload.bus_number ||
      payload.plate_number ||
      "unknown";

    if (!candidateId) {
      return {
        busId: fallbackId,
        imei: fallbackId,
        busNumber: payload.bus_number,
        plateNumber: payload.plate_number,
      };
    }

    const cached = busIdentityCache.get(candidateId);
    if (cached) {
      return cached;
    }

    try {
      const bus = await prisma.bus.findUnique({
        where: { id: candidateId },
        select: {
          busCode: true,
          plateNumber: true,
          maxPassengers: true,
        },
      });

      const resolved: BusIdentity = {
        busId: candidateId,
        imei: candidateId,
        busNumber: payload.bus_number || bus?.busCode,
        plateNumber: payload.plate_number || bus?.plateNumber,
        maxPassengers: bus?.maxPassengers,
      };
      busIdentityCache.set(candidateId, resolved);
      return resolved;
    } catch (error) {
      console.error("Failed to resolve bus identity:", error);
      return {
        busId: candidateId,
        imei: candidateId,
        busNumber: payload.bus_number,
        plateNumber: payload.plate_number,
        maxPassengers: undefined,
      };
    }
  };

  mqttClient.on("connect", () => {
    mqttClient.subscribe(
      [...subscriptionTopics, ...statusSubscriptionTopics],
      (err) => {
        if (err) {
          console.error("MQTT subscribe error:", err);
        }
      },
    );
  });

  mqttClient.on("message", async (rawTopic, message, packet) => {
    console.log("MQTT TOPIC:", rawTopic);
    console.log("MQTT RETAIN:", packet.retain);
    console.log("MQTT PAYLOAD:", message.toString());

    const isStatusMessage =
      normalizeTopicPath(rawTopic).startsWith(statusTopicPath);

    if (isStatusMessage) {
      try {
        const statusPayload = JSON.parse(
          message.toString(),
        ) as MqttBusStatusPayload;
        const busId = statusPayload.busId ? String(statusPayload.busId) : "";
        if (!busId) {
          return;
        }

        const nearestStop = statusPayload.stationName || "-";
        statusByBus.set(busId, {
          nearestStop,
          busStatus: toBusStatusLabel(statusPayload.status, nearestStop),
        });
      } catch (err) {
        console.error("MQTT status payload parse error:", err);
      }
      return;
    }

    let payload: MqttLocationPayload | null = null;
    try {
      payload = JSON.parse(message.toString()) as MqttLocationPayload;
    } catch (err) {
      console.error("MQTT payload parse error:", err);
      return;
    }

    if (!payload) {
      return;
    }

    const lat = Number(payload.lat ?? payload.latitude);
    const lng = Number(payload.lng ?? payload.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    const busIdentity = await resolveBusIdentity(payload);
    const busCapacity = await getBusCapacity(payload, busIdentity);
    const busStatusSnapshot = statusByBus.get(busIdentity.busId);
    const nearestStop =
      busStatusSnapshot?.nearestStop || payload.current_halte || "-";
    const busStatus = busStatusSnapshot?.busStatus || "In Transit";
    const wsPayload: RealtimeWsPayload = {
      coordinates: [
        {
          id: busIdentity.busId,
          imei: busIdentity.imei,
          bus_number: busIdentity.busNumber,
          plate_number: busIdentity.plateNumber,
          longitude: lng,
          latitude: lat,
          status: busStatus,
          bus_status: busStatus,
          nearest_stop: nearestStop,
          speed: payload.speed,
          gps_time: payload.datetime || payload.gps_time,
          current_halte: nearestStop,
          message: payload.message,
          next_halte: payload.next_halte,
          passenger_count: busCapacity.passengerCount,
          max_passengers: busCapacity.maxPassengers,
        },
      ],
      operationalStatus: 1,
    };

    const messageText = JSON.stringify(wsPayload);
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        console.log("Sending WS update for bus:", busIdentity.busId);
        client.send(messageText);
      } else {
        console.log(
          "Skipping WS update for bus due to closed connection:",
          busIdentity.busId,
        );
      }
    });
  });

  mqttClient.on("error", (err) => {
    console.error("MQTT error:", err);
  });

  wss.on("close", () => {
    mqttClient.end(true);
  });

  return wss;
}
