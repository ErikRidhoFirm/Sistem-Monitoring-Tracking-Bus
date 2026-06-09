import { createServer } from "http";
import next from "next";

import { startMqttGeofenceListener } from "./lib/mqtt-geofence";
import { startMqttTapHadoopPipeline } from "./lib/mqtt-tap-hadoop-pipeline";
import { startMqttTripHadoopPipeline } from "./lib/mqtt-trip-hadoop-pipeline";
import { startRealtimeWsServer } from "./lib/realtime-ws-server";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  startMqttGeofenceListener();
  const tapHadoopPipeline = startMqttTapHadoopPipeline();
  const tripHadoopPipeline = startMqttTripHadoopPipeline();
  const server = createServer((req, res) => {
    void handle(req, res);
  });

  startRealtimeWsServer(server);

  const upgradeHandler = nextApp.getUpgradeHandler();
  server.on("upgrade", (req, socket, head) => {
    const requestPath = req.url || "";
    if (requestPath.startsWith("/ws")) {
      return;
    }
    upgradeHandler(req, socket, head);
  });

  server.listen(port);

  const shutdown = () => {
    server.close(async () => {
      await Promise.all([tapHadoopPipeline.stop(), tripHadoopPipeline.stop()]);
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`,
  );
});
