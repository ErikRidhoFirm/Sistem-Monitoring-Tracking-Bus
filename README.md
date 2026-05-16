# Buswy

Buswy is a Next.js (Pages Router) app for bus operations with realtime map tracking, MQTT ingestion, backend WebSocket relay, and IoT tap event pipeline starter.

## Architecture

- IoT devices publish location and tap events to MQTT.
- Backend subscribes MQTT topics and becomes the single realtime source.
- Backend broadcasts normalized bus updates to frontend via WebSocket `/ws`.
- Frontend only renders websocket payload (no geofencing / routing calculations on client).

Realtime flow:

1. Device -> MQTT location topic (`/bus/tracking/location/<busId>`)
2. `lib/mqtt-geofence.ts` computes status (`ARRIVED` / `IN_TRANSIT`) and publishes status topic
3. `lib/realtime-ws-server.ts` consumes location + status + DB metadata and broadcasts WS payload
4. Frontend (`pages/realtime-map.tsx`) consumes WS via `lib/realtime-bus-feed.ts`

Tap event flow (starter template):

1. Device -> MQTT tap topic (`bus/tracking/tap/<busId>`)
2. `lib/mqtt-tap-hadoop-pipeline.ts` buffers per bus/day
3. Periodic flush to sink hook (default sink is placeholder log)

## Run (Bun-friendly custom server)

Use the custom server entry, not plain `next dev`, so MQTT listeners and `/ws` are active.

```bash
bun run server.ts
```

If your workspace still uses npm scripts, ensure they point to `server.ts` for local development.

## Required Environment Variables

Set these in `.env.local` (or runtime env):

- `PORT` (optional, default `3000`)
- `MQTT_BROKER_URL`
- `MQTT_USERNAME` (optional)
- `MQTT_PASSWORD` (optional)
- `MQTT_TRACKING_TOPIC` (for geofence listener)
- `MQTT_STATUS_TOPIC` (for geofence status publish/subscribe)
- `MQTT_TOPIC` (location topic base for websocket relay)
- `MQTT_TAP_TOPIC` (optional, default `bus/tracking/tap`)
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- `NEXT_PUBLIC_REALTIME_WS_URL` (optional; defaults to `ws(s)://<host>/ws`)

## Realtime Payload (frontend log shape)

Browser console logs `[realtime-ws] telemetry` with fields like:

```json
{
  "busId": "cmogol00q0007bcvj5aa3lskf",
  "busCode": "BUS-001",
  "latitude": -7.948766667,
  "longitude": 112.61636,
  "speed": 5.0004,
  "gpsTime": "2026-05-16 05:03:42",
  "nearestStop": "Halte Politeknik Negeri Malang",
  "busStatus": "In Transit",
  "passengerCount": 2,
  "maxPassengers": 30,
  "receivedAt": "2026-05-16T05:03:43.699Z"
}
```

## Key Files

- `server.ts` - custom HTTP server + Next handler + HMR/ws upgrade routing
- `lib/realtime-ws-server.ts` - MQTT subscriber + WS broadcaster
- `lib/mqtt-geofence.ts` - backend geofencing and status topic publisher
- `lib/realtime-bus-feed.ts` - frontend websocket adapter
- `pages/realtime-map.tsx` - realtime UI
- `lib/mqtt-tap-hadoop-pipeline.ts` - tap-in/tap-out Hadoop pipeline starter

## Notes

- Frontend does not compute geofence/status; backend is source of truth.
- Passenger count is read from DB in backend relay on incoming MQTT location event.
- If HMR fails (`/_next/webpack-hmr`), verify server is started from `server.ts` and not plain Next CLI.
