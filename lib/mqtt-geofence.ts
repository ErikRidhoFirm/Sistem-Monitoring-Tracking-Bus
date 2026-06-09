import mqtt, { type IClientOptions, type MqttClient } from "mqtt";

import {
  findStationInRange,
  getDistanceToStationMeters,
  type StationGeofenceSnapshot,
} from "./geofence";
import { prisma } from "./prisma";

type BusLocationPayload = {
  busId?: string;
  lat?: number;
  lng?: number;
};

type StationSnapshot = StationGeofenceSnapshot;

type BusStatus = "ARRIVED" | "IN_TRANSIT";

type StatusState = {
  status: BusStatus;
  stationId: string | null;
  outsideCount: number;
};

const STATION_REFRESH_MS = 2 * 60 * 1000;
const STATUS_PUBLISH_INTERVAL_MS = 10 * 1000;
const EXIT_RADIUS_MARGIN_METERS = 25;
const EXIT_CONFIRMATION_COUNT = 3;

const normalizeTopic = (topic: string) => topic.replace(/\/+$/, "");

const buildTopicVariants = (topic: string) => {
  const normalized = normalizeTopic(topic);
  const withLeading = normalized.startsWith("/")
    ? normalized
    : `/${normalized}`;
  const withoutLeading = normalized.replace(/^\/+/, "");

  return Array.from(new Set([withLeading, withoutLeading]));
};

const extractBusIdFromTopic = (topic: string) => {
  const cleaned = topic.replace(/\/+$/, "");
  const parts = cleaned.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? null;
};

const buildMqttOptions = () => {
  const username = process.env.MQTT_USERNAME;
  const password = process.env.MQTT_PASSWORD;

  const options: IClientOptions = {
    reconnectPeriod: 1000,
    connectTimeout: 30_000,
    clientId: `buswy-geofence-${Math.random().toString(36).slice(2, 10)}`,
  };

  if (username) {
    options.username = username;
  }

  if (password) {
    options.password = password;
  }

  return options;
};

export const startMqttGeofenceListener = () => {
  const brokerUrl = process.env.MQTT_BROKER_URL;
  const trackingTopic = process.env.MQTT_TRACKING_TOPIC;
  const statusTopic = process.env.MQTT_STATUS_TOPIC;

  console.log("MQTT geofence listener booting...");

  if (!brokerUrl || !trackingTopic || !statusTopic) {
    console.warn(
      "MQTT geofence listener is not started due to missing configuration. " +
        "Please set MQTT_BROKER_URL, MQTT_TRACKING_TOPIC, and MQTT_STATUS_TOPIC environment variables.",
    );
    return;
  }

  console.log("MQTT geofence config:", {
    brokerUrl,
    trackingTopic,
    statusTopic,
  });

  const subscribeTopics = buildTopicVariants(trackingTopic).map(
    (topic) => `${topic}/#`,
  );
  const publishTopicBase = normalizeTopic(statusTopic);

  let stations: StationSnapshot[] = [];
  let loadingStations = false;
  const lastStatusByBus = new Map<string, StatusState>();
  const lastPublishAtByBus = new Map<string, number>();

  const refreshStations = async () => {
    if (loadingStations) {
      return;
    }

    loadingStations = true;
    try {
      stations = await prisma.station.findMany({
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          radius: true,
        },
      });
    } catch (error) {
      console.error("Failed to load stations for geofencing:", error);
    } finally {
      loadingStations = false;
    }
  };

  const client: MqttClient = mqtt.connect(brokerUrl, buildMqttOptions());

  client.on("connect", async () => {
    await refreshStations();
    client.subscribe(subscribeTopics, (err) => {
      if (err) {
        console.error("MQTT subscribe error:", err);
      } else {
        console.log("MQTT geofence subscribed:", subscribeTopics);
      }
    });
  });

  client.on("message", (topic, message) => {
    try {
      const payload = JSON.parse(message.toString()) as BusLocationPayload;
      console.log("INI TRACKING MASUK: ");
      const busId = payload.busId || extractBusIdFromTopic(topic);
      const lat = Number(payload.lat);
      const lng = Number(payload.lng);

      if (!busId || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }

      console.log("MQTT geofence payload:", {
        busId,
        lat,
        lng,
        topic,
      });

      const previous = lastStatusByBus.get(busId);
      const match = findStationInRange(stations, lat, lng);
      let station = match?.station ?? null;
      let nextOutsideCount = 0;

      if (!station && previous?.status === "ARRIVED" && previous.stationId) {
        const previousStation = stations.find(
          (item) => item.id === previous.stationId,
        );

        if (previousStation) {
          const distanceMeters = getDistanceToStationMeters(
            previousStation,
            lat,
            lng,
          );
          const exitDistanceMeters =
            previousStation.radius + EXIT_RADIUS_MARGIN_METERS;

          nextOutsideCount =
            distanceMeters > exitDistanceMeters ? previous.outsideCount + 1 : 0;

          if (nextOutsideCount < EXIT_CONFIRMATION_COUNT) {
            station = previousStation;
          }
        }
      }

      const status: BusStatus = station ? "ARRIVED" : "IN_TRANSIT";
      const nextState: StatusState = {
        status,
        stationId: station?.id ?? null,
        outsideCount: status === "ARRIVED" ? nextOutsideCount : 0,
      };
      const now = Date.now();
      const lastPublishAt = lastPublishAtByBus.get(busId) ?? 0;
      const shouldPublishByInterval =
        now - lastPublishAt >= STATUS_PUBLISH_INTERVAL_MS;

      if (
        previous &&
        previous.status === nextState.status &&
        previous.stationId === nextState.stationId &&
        !shouldPublishByInterval
      ) {
        lastStatusByBus.set(busId, nextState);
        return;
      }

      lastStatusByBus.set(busId, nextState);
      lastPublishAtByBus.set(busId, now);

      console.log("MQTT geofence status:", {
        busId,
        status,
        stationName: station?.name ?? "-",
      });

      client.publish(
        `${publishTopicBase}/${busId}`,
        JSON.stringify({
          busId,
          status,
          stationName: station?.name ?? "-",
        }),
      );
    } catch (error) {
      console.error("MQTT geofence message error:", error);
    }
  });

  client.on("error", (error) => {
    console.error("MQTT geofence error:", error);
  });

  client.on("disconnect", () => {
    console.log("MQTT geofence disconnected");
  });

  setInterval(refreshStations, STATION_REFRESH_MS);

  process.on("SIGINT", () => {
    client.end(true);
  });
};
