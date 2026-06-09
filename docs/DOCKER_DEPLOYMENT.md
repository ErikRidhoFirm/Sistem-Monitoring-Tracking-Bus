# Docker Deployment

Panduan ini dipakai saat image dibuild di Windows/local, dipush ke registry, lalu VPS hanya pull image dan menjalankan container dengan `docker compose`.

## Build-Time vs Runtime Environment

Next.js membundle semua variabel `NEXT_PUBLIC_*` saat `next build`. Karena itu, variabel berikut wajib dikirim saat `docker build`:

- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- `NEXT_PUBLIC_BUS_FEED_MODE`
- `NEXT_PUBLIC_MQTT_BROKER_URL`
- `NEXT_PUBLIC_MQTT_TOPIC`
- `NEXT_PUBLIC_MQTT_USERNAME`
- `NEXT_PUBLIC_MQTT_PASSWORD`

Variabel backend/server seperti berikut cukup disediakan saat container berjalan lewat `.env.production` di VPS:

- `DATABASE_URL`
- `DIRECT_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_BASE_URL`
- `MQTT_BROKER_URL`
- `MQTT_TRACKING_TOPIC`
- `MQTT_STATUS_TOPIC`
- `MQTT_USERNAME`
- `MQTT_PASSWORD`

Catatan: `docker compose --env-file .env.production up -d` tidak bisa mengubah nilai `NEXT_PUBLIC_*` yang sudah dibundle ke image. Jika token Mapbox atau public MQTT berubah, build ulang image.

## Build Image di Windows

Jalankan dari root project. Script `build-docker.bat` membaca `.env.production`, mengirim `NEXT_PUBLIC_*` sebagai Docker build args, lalu push image ke registry.

```powershell
docker login
```

```bat
build-docker.bat
```

Default image adalah `bagusok/buswy:latest` dan default env file adalah `.env.production`. Jika perlu override:

```bat
build-docker.bat bagusok/buswy:2026-06-05 .env.production
```

Command manual yang dijalankan script kurang lebih seperti ini:

```powershell
docker build `
  --build-arg NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="<mapbox-public-token>" `
  --build-arg NEXT_PUBLIC_BUS_FEED_MODE="mqtt" `
  --build-arg NEXT_PUBLIC_MQTT_BROKER_URL="wss://<hivemq-host>:8884/mqtt" `
  --build-arg NEXT_PUBLIC_MQTT_TOPIC="bus/tracking/location" `
  --build-arg NEXT_PUBLIC_MQTT_USERNAME="<public-mqtt-username>" `
  --build-arg NEXT_PUBLIC_MQTT_PASSWORD="<public-mqtt-password>" `
  -t bagusok/buswy:latest .
```

Push image ke Docker Hub.

```powershell
docker push bagusok/buswy:latest
```

Opsional, tambahkan tag versi supaya deploy bisa diulang dengan image yang sama.

```powershell
docker build `
  --build-arg NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="<mapbox-public-token>" `
  --build-arg NEXT_PUBLIC_BUS_FEED_MODE="mqtt" `
  --build-arg NEXT_PUBLIC_MQTT_BROKER_URL="wss://<hivemq-host>:8884/mqtt" `
  --build-arg NEXT_PUBLIC_MQTT_TOPIC="bus/tracking/location" `
  --build-arg NEXT_PUBLIC_MQTT_USERNAME="<public-mqtt-username>" `
  --build-arg NEXT_PUBLIC_MQTT_PASSWORD="<public-mqtt-password>" `
  -t bagusok/buswy:latest `
  -t bagusok/buswy:2026-06-05 .
```

```powershell
docker push bagusok/buswy:latest
docker push bagusok/buswy:2026-06-05
```

## Deploy di VPS

Pastikan `.env.production` ada di folder yang sama dengan `docker-compose.prod.yml` di VPS.

Pull image terbaru.

```bash
sh pull-docker.sh
```

Atau manual:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production pull app
```

Start atau recreate container.

```bash
sh run-docker.sh
```

Atau manual:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Jika script sudah diberi executable permission, bisa dijalankan langsung:

```bash
chmod +x pull-docker.sh run-docker.sh
./pull-docker.sh
./run-docker.sh
```

Override file compose/env/service jika diperlukan:

```bash
COMPOSE_FILE=docker-compose.prod.yml ENV_FILE=.env.production SERVICE_NAME=app sh pull-docker.sh
COMPOSE_FILE=docker-compose.prod.yml ENV_FILE=.env.production sh run-docker.sh
```

Cek log aplikasi.

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f app
```

Cek runtime env MQTT di container.

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec app printenv | grep MQTT
```

## Troubleshooting

Jika halaman realtime menampilkan `Token Mapbox Belum Diatur`, image kemungkinan dibuild tanpa `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. Build ulang image dengan `--build-arg NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`, push, lalu pull ulang di VPS.

Jika MQTT backend error berulang, cek runtime env di container dan pastikan broker URL server memakai `mqtts://...:8883`, bukan `wss://...:8884/mqtt`.

Jika VPS masih rebuild source alih-alih pull image, pastikan command deploy memakai `docker-compose.prod.yml`. File `docker-compose.yml` dipakai untuk build lokal, sedangkan `docker-compose.prod.yml` memakai image `bagusok/buswy:latest`.
