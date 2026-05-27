import mqtt, { type IClientOptions, type MqttClient } from "mqtt";

type TapAction = "TAP_IN" | "TAP_OUT" | string;

export type MqttTapEvent = {
  busId: string;
  action: TapAction;
  user?: string;
  stationName?: string;
  lat?: number;
  lng?: number;
  speed?: number;
  sat?: number;
  course?: number;
  time?: string;
  timestamp_ms?: number;
  receivedAt: string;
  topic: string;
};

type BusDayKey = `${string}:${string}`;

type HadoopSinkInput = {
  busId: string;
  date: string;
  events: MqttTapEvent[];
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

const DEFAULT_TOPIC = "bus/tracking/tap";
const DEFAULT_FLUSH_INTERVAL_MS = 30_000;

function getDayUtc(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toFiniteNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function defaultSink(input: HadoopSinkInput): Promise<void> {
  // Starter template only.
  // Implementasi berikutnya:
  // 1) Serialize ke JSONL/Parquet
  // 2) Simpan ke path harian per bus di HDFS/S3 Data Lake
  //    contoh: /buswy/tap-events/date=YYYY-MM-DD/busId=<id>/part-*.jsonl
  console.log("[tap-hadoop-pipeline] flush", {
    busId: input.busId,
    date: input.date,
    count: input.events.length,
  });
}

export function startMqttTapHadoopPipeline(options: PipelineOptions = {}) {
  const brokerUrl = options.brokerUrl || process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
  const topic = options.topic || process.env.MQTT_TAP_TOPIC || DEFAULT_TOPIC;
  const normalizedTopic = topic.replace(/\/+$/, "");
  const subscriptionTopics = [`${normalizedTopic}/#`];
  const flushIntervalMs = options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
  const sink = options.sink || defaultSink;

  const clientOptions: IClientOptions = {
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    clientId: `buswy-tap-hadoop-${Math.random().toString(36).slice(2, 10)}`,
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
  const buckets = new Map<BusDayKey, MqttTapEvent[]>();

  const flush = async () => {
    const keys = Array.from(buckets.keys());
    for (const key of keys) {
      const events = buckets.get(key) || [];
      if (events.length === 0) {
        continue;
      }

      const [busId, date] = key.split(":");
      try {
        await sink({ busId, date, events: [...events] });
        buckets.set(key, []);
      } catch (error) {
        console.error("[tap-hadoop-pipeline] sink error", { key, error });
      }
    }
  };

  const flushTimer = setInterval(() => {
    void flush();
  }, flushIntervalMs);

  client.on("connect", () => {
    client.subscribe(subscriptionTopics, (err) => {
      if (err) {
        console.error("[tap-hadoop-pipeline] subscribe error", err);
        return;
      }
      console.log("[tap-hadoop-pipeline] subscribed", subscriptionTopics);
    });
  });

  client.on("message", (rawTopic, message) => {
    try {
      const rawPayload = message.toString();
      const parsed = JSON.parse(message.toString()) as Record<string, unknown>;
      const busId = String(parsed.busId || "").trim();
      if (!busId) {
        console.warn("[tap-hadoop-pipeline] skip payload without busId", {
          topic: rawTopic,
          payload: rawPayload,
        });
        return;
      }

      const receivedAtDate = new Date();
      const receivedAt = receivedAtDate.toISOString();
      const date = getDayUtc(receivedAtDate);
      const key: BusDayKey = `${busId}:${date}`;
      const nextEvent: MqttTapEvent = {
        busId,
        action: String(parsed.action || "UNKNOWN"),
        user: parsed.user ? String(parsed.user) : undefined,
        stationName: parsed.stationName ? String(parsed.stationName) : undefined,
        lat: toFiniteNumber(parsed.lat),
        lng: toFiniteNumber(parsed.lng),
        speed: toFiniteNumber(parsed.speed),
        sat: toFiniteNumber(parsed.sat),
        course: toFiniteNumber(parsed.course),
        time: parsed.time ? String(parsed.time) : undefined,
        timestamp_ms: toFiniteNumber(parsed.timestamp_ms),
        receivedAt,
        topic: rawTopic,
      };

      const existing = buckets.get(key) || [];
      existing.push(nextEvent);
      buckets.set(key, existing);

      console.log("[tap-hadoop-pipeline] tap-event", {
        busId: nextEvent.busId,
        action: nextEvent.action,
        user: nextEvent.user,
        stationName: nextEvent.stationName,
        time: nextEvent.time,
        topic: nextEvent.topic,
        bufferedCount: existing.length,
      });
    } catch (error) {
      console.error("[tap-hadoop-pipeline] parse error", {
        topic: rawTopic,
        payload: message.toString(),
        error,
      });
    }
  });

  client.on("error", (error) => {
    console.error("[tap-hadoop-pipeline] mqtt error", error);
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
