import mqtt, { type IClientOptions, type MqttClient } from "mqtt";

import { appendHadoopJsonLines, getHadoopFlushIntervalMs } from "./hadoop-httpfs-sink";

type MqttTripPayload = {
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
  gps_time?: string;
  datetime?: string;
  current_halte?: string;
  next_halte?: string;
  message?: string;
  sat?: number;
  course?: number;
  firmware_version?: string;
  timestamp_ms?: number;
};

export type MqttTripEvent = {
  busId: string;
  imei?: string;
  busNumber?: string;
  plateNumber?: string;
  lat: number;
  lng: number;
  speed?: number;
  gpsTime?: string;
  currentHalte?: string;
  nextHalte?: string;
  message?: string;
  sat?: number;
  course?: number;
  firmwareVersion?: string;
  timestamp_ms?: number;
  receivedAt: string;
  topic: string;
};

type BusDayKey = `${string}:${string}`;

type HadoopSinkInput = {
  busId: string;
  date: string;
  events: MqttTripEvent[];
};

export type HadoopSink = (input: HadoopSinkInput) => Promise<void>;

type PipelineOptions = {
  brokerUrl?: string;
  topic?: string;
  username?: string;
  password?: string;
  flushIntervalMs?: number;
  sink?: HadoopSink;
};

const DEFAULT_TOPIC = "/bus/tracking/location";
const DEFAULT_FLUSH_INTERVAL_MS = 60 * 1000;

function getDayUtc(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toFiniteNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeTopic(topic: string) {
  return topic.replace(/\/+$/, "");
}

function buildTopicVariants(topic: string) {
  const normalized = normalizeTopic(topic);
  const withLeading = normalized.startsWith("/") ? normalized : `/${normalized}`;
  const withoutLeading = normalized.replace(/^\/+/, "");

  return Array.from(new Set([withLeading, withoutLeading])).map(
    (topicVariant) => `${topicVariant}/#`,
  );
}

function extractBusIdFromTopic(topic: string) {
  const parts = topic.replace(/\/+$/, "").split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

async function defaultSink(input: HadoopSinkInput): Promise<void> {
  await appendHadoopJsonLines({
    dataset: "tracking",
    busId: input.busId,
    date: input.date,
    events: input.events,
  });
}

export function startMqttTripHadoopPipeline(options: PipelineOptions = {}) {
  const brokerUrl =
    options.brokerUrl || process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
  const topic =
    options.topic || process.env.MQTT_TRACKING_TOPIC || process.env.MQTT_TOPIC || DEFAULT_TOPIC;
  const subscriptionTopics = buildTopicVariants(topic);
  const flushIntervalMs =
    options.flushIntervalMs ?? getHadoopFlushIntervalMs(DEFAULT_FLUSH_INTERVAL_MS);
  const sink = options.sink || defaultSink;

  console.log("[trip-hadoop-pipeline] boot", {
    brokerUrl,
    topic,
    subscriptionTopics,
    flushIntervalMs,
  });

  const clientOptions: IClientOptions = {
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    clientId: `buswy-trip-hadoop-${Math.random().toString(36).slice(2, 10)}`,
  };

  const username = options.username || process.env.MQTT_USERNAME;
  const password = options.password || process.env.MQTT_PASSWORD;
  if (username) {
    clientOptions.username = username;
  }
  if (password) {
    clientOptions.password = password;
  }

  const client: MqttClient = mqtt.connect(brokerUrl, clientOptions);
  const buckets = new Map<BusDayKey, MqttTripEvent[]>();

  const getTotalBufferedEvents = () =>
    Array.from(buckets.values()).reduce((total, events) => total + events.length, 0);

  const flush = async () => {
    const keys = Array.from(buckets.keys());
    const totalBufferedEvents = getTotalBufferedEvents();
    console.log("[trip-hadoop-pipeline] flush tick", {
      bucketCount: keys.length,
      totalBufferedEvents,
    });

    if (totalBufferedEvents === 0) {
      console.log("[trip-hadoop-pipeline] flush skipped: no buffered events");
      return;
    }

    for (const key of keys) {
      const events = buckets.get(key) || [];
      if (events.length === 0) {
        continue;
      }

      const [busId, date] = key.split(":");
      try {
        console.log("[trip-hadoop-pipeline] flushing", {
          busId,
          date,
          count: events.length,
        });
        await sink({ busId, date, events: [...events] });
        buckets.set(key, []);
        console.log("[trip-hadoop-pipeline] flush success", {
          busId,
          date,
          count: events.length,
        });
      } catch (error) {
        console.error("[trip-hadoop-pipeline] sink error", { key, error });
      }
    }
  };

  const flushTimer = setInterval(() => {
    void flush();
  }, flushIntervalMs);

  client.on("connect", () => {
    console.log("[trip-hadoop-pipeline] mqtt connected");
    client.subscribe(subscriptionTopics, (err) => {
      if (err) {
        console.error("[trip-hadoop-pipeline] subscribe error", err);
        return;
      }
      console.log("[trip-hadoop-pipeline] subscribed", subscriptionTopics);
    });
  });

  client.on("message", (rawTopic, message) => {
    try {
      const rawPayload = message.toString();
      const parsed = JSON.parse(rawPayload) as MqttTripPayload;
      const busId = String(parsed.busId || extractBusIdFromTopic(rawTopic)).trim();
      const lat = toFiniteNumber(parsed.lat ?? parsed.latitude);
      const lng = toFiniteNumber(parsed.lng ?? parsed.longitude);

      if (!busId || lat == null || lng == null) {
        console.warn("[trip-hadoop-pipeline] skip invalid location payload", {
          topic: rawTopic,
          payload: rawPayload,
        });
        return;
      }

      const receivedAtDate = new Date();
      const receivedAt = receivedAtDate.toISOString();
      const date = getDayUtc(receivedAtDate);
      const key: BusDayKey = `${busId}:${date}`;
      const nextEvent: MqttTripEvent = {
        busId,
        imei: parsed.imei ? String(parsed.imei) : undefined,
        busNumber: parsed.bus_number ? String(parsed.bus_number) : undefined,
        plateNumber: parsed.plate_number ? String(parsed.plate_number) : undefined,
        lat,
        lng,
        speed: toFiniteNumber(parsed.speed),
        gpsTime: parsed.gps_time || parsed.datetime,
        currentHalte: parsed.current_halte,
        nextHalte: parsed.next_halte,
        message: parsed.message,
        sat: toFiniteNumber(parsed.sat),
        course: toFiniteNumber(parsed.course),
        firmwareVersion: parsed.firmware_version,
        timestamp_ms: toFiniteNumber(parsed.timestamp_ms),
        receivedAt,
        topic: rawTopic,
      };

      const existing = buckets.get(key) || [];
      existing.push(nextEvent);
      buckets.set(key, existing);

      console.log("[trip-hadoop-pipeline] trip-event", {
        busId: nextEvent.busId,
        lat: nextEvent.lat,
        lng: nextEvent.lng,
        gpsTime: nextEvent.gpsTime,
        topic: nextEvent.topic,
        bufferedCount: existing.length,
      });
    } catch (error) {
      console.error("[trip-hadoop-pipeline] parse error", {
        topic: rawTopic,
        payload: message.toString(),
        error,
      });
    }
  });

  client.on("error", (error) => {
    console.error("[trip-hadoop-pipeline] mqtt error", error);
  });

  const stop = async () => {
    clearInterval(flushTimer);
    await flush();
    client.end(true);
  };

  return {
    stop,
  };
}
