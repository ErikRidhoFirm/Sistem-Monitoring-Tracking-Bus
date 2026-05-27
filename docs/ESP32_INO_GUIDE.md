# Panduan Pembuatan Kode `.ino` ESP32 Buswy

Dokumen ini adalah kontrak firmware ESP32 untuk integrasi dengan Buswy. Gunakan dokumen ini sebagai acuan saat membuat file Arduino `.ino` untuk perangkat IoT bus.

Firmware ESP32 bertugas untuk:

- Membaca GPS bus.
- Membaca kartu RFID penumpang.
- Mengirim lokasi bus ke MQTT.
- Mengirim event tap RFID ke API backend.
- Mengirim event tap ringkas ke MQTT pipeline opsional.
- Menerima status halte/geofence dari MQTT.
- Menampilkan status ke Serial Monitor, buzzer, LED, atau LCD jika tersedia.

## 1. Arsitektur Integrasi

Alur lokasi bus:

1. ESP32 membaca GPS.
2. ESP32 publish MQTT ke topic `/bus/tracking/location/{busId}`.
3. Backend membaca topic lokasi.
4. Backend menghitung geofence halte.
5. Backend publish status ke `/bus/tracking/status/{busId}`.
6. Frontend realtime map menerima data dari backend WebSocket `/ws`.

Alur tap RFID:

1. ESP32 membaca UID kartu RFID.
2. ESP32 kirim HTTP `POST` ke `/api/bus/rfid/tap-transactions`.
3. Backend validasi `deviceKey`, bus, kartu, saldo, dan kapasitas bus.
4. Backend menyimpan transaksi `TAP_IN` atau `TAP_OUT`.
5. ESP32 menampilkan hasil sukses/gagal.
6. Opsional: ESP32 publish ringkasan tap ke MQTT `bus/tracking/tap/{busId}` untuk pipeline data.

## 2. Library Arduino yang Disarankan

Install library berikut lewat Arduino IDE Library Manager:

- `WiFi` bawaan ESP32.
- `HTTPClient` bawaan ESP32.
- `ArduinoJson` untuk encode/decode JSON.
- `PubSubClient` untuk MQTT.
- `TinyGPSPlus` untuk GPS NEO-6M/NEO-M8N.
- `MFRC522` untuk RFID RC522.
- `SPI` bawaan Arduino untuk RFID RC522.

Jika memakai broker MQTT TLS, gunakan `WiFiClientSecure`. Jika broker lokal tanpa TLS, gunakan `WiFiClient`.

## 3. Pin ESP32

Pin berikut adalah standar rekomendasi untuk kode `.ino`. Jika wiring fisik berbeda, ubah nilai konstanta pin di firmware, tetapi nama variabel sebaiknya tetap sama agar kode mudah dibaca.

### 3.1 Pin RFID RC522

| Komponen RC522 | Nama Variabel `.ino` | Pin ESP32 | Keterangan |
| --- | --- | ---: | --- |
| SDA / SS | `PIN_RFID_SS` | `5` | Chip select SPI RFID. |
| SCK | `PIN_RFID_SCK` | `18` | SPI clock. |
| MOSI | `PIN_RFID_MOSI` | `23` | SPI MOSI. |
| MISO | `PIN_RFID_MISO` | `19` | SPI MISO. |
| RST | `PIN_RFID_RST` | `22` | Reset RC522. |
| 3.3V | - | `3V3` | Jangan pakai 5V untuk RC522. |
| GND | - | `GND` | Ground bersama ESP32. |

Contoh konstanta:

```cpp
const int PIN_RFID_SS = 5;
const int PIN_RFID_RST = 22;
const int PIN_RFID_SCK = 18;
const int PIN_RFID_MOSI = 23;
const int PIN_RFID_MISO = 19;
```

### 3.2 Pin GPS

| Komponen GPS | Nama Variabel `.ino` | Pin ESP32 | Keterangan |
| --- | --- | ---: | --- |
| TX GPS | `PIN_GPS_RX` | `16` | Masuk ke RX ESP32. |
| RX GPS | `PIN_GPS_TX` | `17` | Keluar dari TX ESP32. Opsional jika GPS hanya transmit. |
| VCC | - | `3V3` atau `5V` | Sesuaikan modul GPS. |
| GND | - | `GND` | Ground bersama ESP32. |

Contoh konstanta:

```cpp
const int PIN_GPS_RX = 16;
const int PIN_GPS_TX = 17;
const uint32_t GPS_BAUD_RATE = 9600;
```

### 3.3 Pin Output Status

| Fungsi | Nama Variabel `.ino` | Pin ESP32 | Keterangan |
| --- | --- | ---: | --- |
| LED WiFi | `PIN_LED_WIFI` | `2` | LED onboard pada banyak board ESP32. |
| LED MQTT | `PIN_LED_MQTT` | `4` | Menyala saat MQTT connected. |
| LED Tap sukses | `PIN_LED_SUCCESS` | `26` | Nyala singkat saat tap sukses. |
| LED Tap gagal | `PIN_LED_ERROR` | `27` | Nyala singkat saat tap gagal. |
| Buzzer | `PIN_BUZZER` | `25` | Bunyi sukses/gagal. |

Contoh konstanta:

```cpp
const int PIN_LED_WIFI = 2;
const int PIN_LED_MQTT = 4;
const int PIN_LED_SUCCESS = 26;
const int PIN_LED_ERROR = 27;
const int PIN_BUZZER = 25;
```

### 3.4 Ringkasan Pin

| Nama Variabel | Pin | Wajib | Fungsi |
| --- | ---: | --- | --- |
| `PIN_RFID_SS` | `5` | Ya | RFID SPI chip select. |
| `PIN_RFID_RST` | `22` | Ya | RFID reset. |
| `PIN_RFID_SCK` | `18` | Ya | RFID SPI SCK. |
| `PIN_RFID_MOSI` | `23` | Ya | RFID SPI MOSI. |
| `PIN_RFID_MISO` | `19` | Ya | RFID SPI MISO. |
| `PIN_GPS_RX` | `16` | Ya | GPS TX ke ESP32 RX. |
| `PIN_GPS_TX` | `17` | Opsional | ESP32 TX ke GPS RX. |
| `PIN_LED_WIFI` | `2` | Opsional | Indikator WiFi. |
| `PIN_LED_MQTT` | `4` | Opsional | Indikator MQTT. |
| `PIN_LED_SUCCESS` | `26` | Opsional | Indikator tap sukses. |
| `PIN_LED_ERROR` | `27` | Opsional | Indikator tap gagal. |
| `PIN_BUZZER` | `25` | Opsional | Feedback suara. |

## 4. Variabel Konfigurasi Firmware

Semua variabel berikut sebaiknya diletakkan di bagian atas file `.ino`.

### 4.1 Identitas Device dan Bus

| Nama Variabel | Contoh Value | Wajib | Keterangan |
| --- | --- | --- | --- |
| `BUS_ID` | `"cmogol00q0007bcvj5aa3lskf"` | Ya | ID bus dari database Buswy. Harus sama dengan `bus.id`. |
| `BUS_CODE` | `"BUS-001"` | Disarankan | Kode bus untuk log/debug. |
| `PLATE_NUMBER` | `"N 1234 AB"` | Opsional | Nomor polisi untuk log/debug. |
| `DEVICE_SERIAL` | `"ESP32-BUS-001"` | Disarankan | Serial number device. Cocokkan dengan data IoT device jika dipakai admin. |
| `DEVICE_KEY` | `"device-secret-key"` | Ya untuk API tap | Secret device. Harus sama dengan `iot_device.deviceKeyHash` di database saat ini. |
| `FIRMWARE_VERSION` | `"1.0.0"` | Disarankan | Versi firmware untuk debugging. |

Catatan penting: field database bernama `deviceKeyHash`, tetapi implementasi API saat ini mencocokkan value secara langsung dari `deviceKey`. Jadi firmware harus mengirim `DEVICE_KEY` persis seperti value yang tersimpan.

Contoh:

```cpp
const char* BUS_ID = "cmogol00q0007bcvj5aa3lskf";
const char* BUS_CODE = "BUS-001";
const char* PLATE_NUMBER = "N 1234 AB";
const char* DEVICE_SERIAL = "ESP32-BUS-001";
const char* DEVICE_KEY = "device-secret-key";
const char* FIRMWARE_VERSION = "1.0.0";
```

### 4.2 WiFi

| Nama Variabel | Contoh Value | Wajib | Keterangan |
| --- | --- | --- | --- |
| `WIFI_SSID` | `"NamaWiFi"` | Ya | SSID WiFi. |
| `WIFI_PASSWORD` | `"passwordwifi"` | Ya | Password WiFi. |
| `WIFI_RECONNECT_INTERVAL_MS` | `5000` | Disarankan | Interval reconnect. |

Contoh:

```cpp
const char* WIFI_SSID = "NamaWiFi";
const char* WIFI_PASSWORD = "passwordwifi";
const unsigned long WIFI_RECONNECT_INTERVAL_MS = 5000;
```

### 4.3 Backend HTTP

| Nama Variabel | Contoh Value | Wajib | Keterangan |
| --- | --- | --- | --- |
| `API_BASE_URL` | `"http://192.168.1.10:3000"` | Ya untuk RFID | Base URL backend Buswy. |
| `TAP_TRANSACTION_ENDPOINT` | `"/api/bus/rfid/tap-transactions"` | Ya untuk RFID | Endpoint tap RFID. |
| `HTTP_TIMEOUT_MS` | `10000` | Disarankan | Timeout request HTTP. |

Contoh:

```cpp
const char* API_BASE_URL = "http://192.168.1.10:3000";
const char* TAP_TRANSACTION_ENDPOINT = "/api/bus/rfid/tap-transactions";
const unsigned long HTTP_TIMEOUT_MS = 10000;
```

URL lengkap endpoint tap:

```text
POST {API_BASE_URL}/api/bus/rfid/tap-transactions
```

Contoh lokal:

```text
POST http://192.168.1.10:3000/api/bus/rfid/tap-transactions
```

### 4.4 MQTT HiveMQ Cloud

Standar project ini untuk ESP32 adalah memakai HiveMQ Cloud melalui MQTT TLS.

Penting:

- ESP32 memakai endpoint MQTT TCP TLS HiveMQ, bukan WebSocket.
- Gunakan port `8883` untuk MQTT TLS.
- Jangan gunakan endpoint `wss://...:8884/mqtt` di firmware ESP32 kecuali library MQTT yang dipakai memang mendukung WebSocket. `PubSubClient` standar tidak mendukung MQTT over WebSocket.
- Backend Node.js boleh memakai `mqtts://...:8883` untuk koneksi server-side ke HiveMQ.
- Username dan password HiveMQ wajib diisi jika cluster HiveMQ memakai authentication.

Format data dari HiveMQ Cloud yang harus diambil:

| Data HiveMQ | Contoh | Dipakai Untuk |
| --- | --- | --- |
| Cluster host | `xxxxxxxxxxxx.s1.eu.hivemq.cloud` | `MQTT_HOST` di ESP32. |
| MQTT TLS port | `8883` | `MQTT_PORT` di ESP32. |
| WebSocket TLS port | `8884` | Tidak dipakai firmware `PubSubClient`. |
| Username | `buswy_tracker` | `MQTT_USERNAME`. |
| Password | `password-kuat` | `MQTT_PASSWORD`. |

Jika HiveMQ memberi URL seperti ini:

```text
wss://xxxxxxxxxxxx.s1.eu.hivemq.cloud:8884/mqtt
```

Maka untuk ESP32 `PubSubClient`, ambil hanya host-nya dan gunakan port MQTT TLS:

```cpp
const char* MQTT_HOST = "xxxxxxxxxxxx.s1.eu.hivemq.cloud";
const int MQTT_PORT = 8883;
```

| Nama Variabel | Contoh Value | Wajib | Keterangan |
| --- | --- | --- | --- |
| `MQTT_HOST` | `"xxxxxxxxxxxx.s1.eu.hivemq.cloud"` | Ya | Host HiveMQ Cloud tanpa `mqtts://`, tanpa `wss://`, dan tanpa path `/mqtt`. |
| `MQTT_PORT` | `8883` | Ya | Port MQTT TLS HiveMQ Cloud. |
| `MQTT_USERNAME` | `"buswy_tracker"` | Ya | Username access credential HiveMQ. |
| `MQTT_PASSWORD` | `"password-kuat"` | Ya | Password access credential HiveMQ. |
| `MQTT_CLIENT_ID` | `"buswy-esp32-BUS-001"` | Ya | Client ID unik per device. |
| `MQTT_LOCATION_TOPIC_BASE` | `"/bus/tracking/location"` | Ya | Base topic lokasi. |
| `MQTT_STATUS_TOPIC_BASE` | `"/bus/tracking/status"` | Ya | Base topic status dari backend. |
| `MQTT_TAP_TOPIC_BASE` | `"bus/tracking/tap"` | Opsional | Base topic tap event untuk pipeline. |
| `MQTT_RECONNECT_INTERVAL_MS` | `5000` | Disarankan | Interval reconnect MQTT. |
| `LOCATION_PUBLISH_INTERVAL_MS` | `3000` | Disarankan | Interval publish lokasi GPS. |

Contoh:

```cpp
const char* MQTT_HOST = "xxxxxxxxxxxx.s1.eu.hivemq.cloud";
const int MQTT_PORT = 8883;
const char* MQTT_USERNAME = "buswy_tracker";
const char* MQTT_PASSWORD = "password-kuat";
const char* MQTT_CLIENT_ID = "buswy-esp32-BUS-001";
const char* MQTT_LOCATION_TOPIC_BASE = "/bus/tracking/location";
const char* MQTT_STATUS_TOPIC_BASE = "/bus/tracking/status";
const char* MQTT_TAP_TOPIC_BASE = "bus/tracking/tap";
const unsigned long MQTT_RECONNECT_INTERVAL_MS = 5000;
const unsigned long LOCATION_PUBLISH_INTERVAL_MS = 3000;
```

Topic final harus dibuat dari base topic + `BUS_ID`:

```cpp
String mqttLocationTopic = String(MQTT_LOCATION_TOPIC_BASE) + "/" + BUS_ID;
String mqttStatusTopic = String(MQTT_STATUS_TOPIC_BASE) + "/" + BUS_ID;
String mqttTapTopic = String(MQTT_TAP_TOPIC_BASE) + "/" + BUS_ID;
```

Contoh object client untuk HiveMQ TLS:

```cpp
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

WiFiClientSecure wifiSecureClient;
PubSubClient mqttClient(wifiSecureClient);

void setupMqtt() {
  wifiSecureClient.setInsecure();
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
}
```

Catatan: `wifiSecureClient.setInsecure()` paling mudah untuk development karena tidak memvalidasi certificate chain. Untuk produksi yang lebih aman, gunakan root CA HiveMQ/DigiCert sesuai certificate cluster dan panggil `wifiSecureClient.setCACert(rootCaCertificate)`.

## 5. Endpoint MQTT

### 5.1 Publish Lokasi Bus

ESP32 publish ke:

```text
/bus/tracking/location/{busId}
```

Contoh:

```text
/bus/tracking/location/cmogol00q0007bcvj5aa3lskf
```

Backend subscribe menggunakan wildcard:

```text
/bus/tracking/location/#
```

Jika environment backend memakai topic tanpa `/` di depan, backend tetap bisa memproses untuk geofence, tetapi standar firmware disarankan tetap memakai `/bus/tracking/location/{busId}` agar sesuai README.

### 5.2 Subscribe Status Bus dari Backend

ESP32 subscribe ke:

```text
/bus/tracking/status/{busId}
```

Contoh:

```text
/bus/tracking/status/cmogol00q0007bcvj5aa3lskf
```

Backend publish status ini setelah membaca lokasi dan menghitung geofence halte.

### 5.3 Publish Tap Event MQTT Opsional

ESP32 boleh publish ringkasan tap ke:

```text
bus/tracking/tap/{busId}
```

Contoh:

```text
bus/tracking/tap/cmogol00q0007bcvj5aa3lskf
```

Topic ini dipakai oleh `lib/mqtt-tap-hadoop-pipeline.ts` sebagai pipeline starter. Ini bukan pengganti HTTP API tap. Transaksi saldo, kapasitas, dan tap in/out tetap wajib lewat HTTP endpoint `/api/bus/rfid/tap-transactions`.

## 6. Standar JSON yang Dikirim ESP32

### 6.1 MQTT Publish Lokasi Bus

Payload minimum yang wajib dikirim:

```json
{
  "busId": "cmogol00q0007bcvj5aa3lskf",
  "lat": -7.948766667,
  "lng": 112.61636
}
```

Payload lengkap yang disarankan:

```json
{
  "busId": "cmogol00q0007bcvj5aa3lskf",
  "imei": "ESP32-BUS-001",
  "bus_number": "BUS-001",
  "plate_number": "N 1234 AB",
  "lat": -7.948766667,
  "lng": 112.61636,
  "speed": 5.0004,
  "gps_time": "2026-05-16 05:03:42",
  "current_halte": "-",
  "next_halte": "-",
  "message": "GPS fix",
  "sat": 8,
  "course": 135.5,
  "firmware_version": "1.0.0",
  "timestamp_ms": 1778917422000
}
```

Field yang dibaca backend realtime saat ini:

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `busId` | string | Disarankan kuat | ID bus. Dipakai untuk resolve data bus dari database. |
| `lat` | number | Ya | Latitude. Bisa juga `latitude`, tetapi standar firmware pakai `lat`. |
| `lng` | number | Ya | Longitude. Bisa juga `longitude`, tetapi standar firmware pakai `lng`. |
| `imei` | string | Opsional | Fallback identity jika `busId` tidak ada. |
| `id` | string/number | Opsional | Fallback identity jika `busId` tidak ada. |
| `bus_number` | string | Opsional | Kode bus untuk frontend. |
| `plate_number` | string | Opsional | Nomor polisi untuk frontend. |
| `speed` | number | Opsional | Kecepatan dari GPS. |
| `datetime` | string | Opsional | Waktu GPS alternatif. |
| `gps_time` | string | Opsional | Waktu GPS standar firmware. |
| `current_halte` | string | Opsional | Halte saat ini. Backend akan override jika status geofence tersedia. |
| `message` | string | Opsional | Pesan status device. |
| `next_halte` | string | Opsional | Halte berikutnya. |
| `passenger_count` | number | Tidak dipakai utama | Backend saat ini mengambil passenger count dari database. |
| `passengerCount` | number | Tidak dipakai utama | Alternatif camelCase. |
| `max_passengers` | number | Tidak dipakai utama | Backend saat ini mengambil kapasitas dari database. |
| `maxPassengers` | number | Tidak dipakai utama | Alternatif camelCase. |

Validasi penting:

- `lat` dan `lng` harus angka valid.
- Jangan kirim string kosong untuk koordinat.
- Gunakan titik desimal, bukan koma desimal.
- Publish hanya saat GPS punya fix valid.
- Jika GPS belum fix, boleh skip publish atau kirim status `message`, tetapi backend akan mengabaikan payload tanpa koordinat valid.

### 6.2 HTTP Request Tap RFID

Endpoint:

```text
POST {API_BASE_URL}/api/bus/rfid/tap-transactions
Content-Type: application/json
```

Payload wajib:

```json
{
  "rfidTag": "CARD-001",
  "busId": "cmogol00q0007bcvj5aa3lskf",
  "deviceKey": "device-secret-key"
}
```

Payload lengkap yang disarankan:

```json
{
  "rfidTag": "CARD-001",
  "busId": "cmogol00q0007bcvj5aa3lskf",
  "deviceKey": "device-secret-key",
  "latitude": -7.948766667,
  "longitude": 112.61636,
  "stationName": "Halte Politeknik Negeri Malang"
}
```

Field request tap:

| Field | Tipe | Wajib | Value dari Firmware | Keterangan |
| --- | --- | --- | --- | --- |
| `rfidTag` | string | Ya | UID kartu RFID | UID harus sama dengan `card.rfidTag` di database. |
| `busId` | string | Ya | `BUS_ID` | ID bus tempat device dipasang. |
| `deviceKey` | string | Ya | `DEVICE_KEY` | Secret device yang aktif dan sedang terhubung ke bus tersebut. |
| `latitude` | number | Opsional | GPS latitude terakhir | Disimpan ke transaksi sebagai `latTap`. |
| `longitude` | number | Opsional | GPS longitude terakhir | Disimpan ke transaksi sebagai `lngTap`. |
| `stationName` | string | Opsional | Status halte terakhir | Disimpan ke transaksi. Jika kosong/null, backend jadikan `-`. |

Aturan backend:

- Backend otomatis menentukan `TAP_IN` atau `TAP_OUT` dari status kartu `isInside`.
- Firmware tidak perlu mengirim action untuk HTTP tap.
- Saat `TAP_IN`, saldo dipotong sesuai `bus.price`.
- Saat `TAP_IN`, request ditolak jika bus penuh.
- Saat `TAP_OUT`, kartu harus tap out di bus yang sama dengan `lastBusId`.
- `deviceKey` harus valid.
- Device harus sedang terhubung ke `busId` yang dikirim.

### 6.3 MQTT Publish Tap Event Opsional

Topic:

```text
bus/tracking/tap/{busId}
```

Payload minimum:

```json
{
  "busId": "cmogol00q0007bcvj5aa3lskf",
  "action": "TAP_IN",
  "user": "CARD-001"
}
```

Payload lengkap yang disarankan:

```json
{
  "busId": "cmogol00q0007bcvj5aa3lskf",
  "action": "TAP_IN",
  "user": "CARD-001",
  "stationName": "Halte Politeknik Negeri Malang",
  "lat": -7.948766667,
  "lng": 112.61636,
  "speed": 5.0004,
  "sat": 8,
  "course": 135.5,
  "time": "2026-05-16 05:03:42",
  "timestamp_ms": 1778917422000
}
```

Field yang dibaca pipeline MQTT tap:

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `busId` | string | Ya | Jika kosong, payload akan di-skip. |
| `action` | string | Disarankan | `TAP_IN`, `TAP_OUT`, atau `UNKNOWN`. |
| `user` | string | Opsional | Saat ini cocok untuk isi UID RFID/card tag. |
| `stationName` | string | Opsional | Nama halte saat tap. |
| `lat` | number | Opsional | Latitude saat tap. |
| `lng` | number | Opsional | Longitude saat tap. |
| `speed` | number | Opsional | Kecepatan GPS. |
| `sat` | number | Opsional | Jumlah satelit GPS. |
| `course` | number | Opsional | Arah/heading GPS. |
| `time` | string | Opsional | Waktu dari GPS/device. |
| `timestamp_ms` | number | Opsional | Unix timestamp milidetik. |

Rekomendasi: publish MQTT tap hanya setelah HTTP tap sukses agar action yang dikirim sesuai hasil backend.

## 7. Standar JSON yang Diterima ESP32

### 7.1 MQTT Status Geofence dari Backend

ESP32 subscribe ke:

```text
/bus/tracking/status/{busId}
```

Payload yang dikirim backend:

```json
{
  "busId": "cmogol00q0007bcvj5aa3lskf",
  "status": "ARRIVED",
  "stationName": "Halte Politeknik Negeri Malang"
}
```

Atau saat bus tidak berada dalam radius halte:

```json
{
  "busId": "cmogol00q0007bcvj5aa3lskf",
  "status": "IN_TRANSIT",
  "stationName": "-"
}
```

Field status:

| Field | Tipe | Value | Keterangan |
| --- | --- | --- | --- |
| `busId` | string | ID bus | Harus sama dengan `BUS_ID`. |
| `status` | string | `ARRIVED` atau `IN_TRANSIT` | Status geofence backend. |
| `stationName` | string | Nama halte atau `-` | Nama halte jika bus masuk radius halte. |

Firmware harus menyimpan status terakhir:

```cpp
String currentBusStatus = "IN_TRANSIT";
String currentStationName = "-";
```

Gunakan `currentStationName` sebagai `stationName` saat mengirim tap HTTP.

### 7.2 Response Sukses HTTP Tap

Contoh response `201`:

```json
{
  "success": true,
  "data": {
    "action": "TAP_IN",
    "transaction": {
      "id": "f7f7d2f0-1111-2222-3333-123456789abc",
      "type": "IN",
      "amount": 2500,
      "latTap": -7.948766667,
      "lngTap": 112.61636,
      "stationName": "Halte Politeknik Negeri Malang",
      "createdAt": "2026-04-27T09:35:00.000Z",
      "rfidTag": "CARD-001",
      "busId": "cmogol00q0007bcvj5aa3lskf"
    },
    "card": {
      "id": "1e9fd7a8-1111-2222-3333-123456789abc",
      "rfidTag": "CARD-001",
      "isInside": true,
      "lastBusId": "cmogol00q0007bcvj5aa3lskf",
      "user": {
        "name": "Budi"
      }
    },
    "bus": {
      "id": "cmogol00q0007bcvj5aa3lskf",
      "passengerCount": 24
    }
  },
  "message": "Tap in recorded",
  "meta": null
}
```

Field response yang perlu dibaca firmware:

| Path JSON | Tipe | Keterangan |
| --- | --- | --- |
| `success` | boolean | `true` jika tap berhasil. |
| `data.action` | string | `TAP_IN` atau `TAP_OUT`. |
| `data.transaction.amount` | number | Nominal potongan. `0` saat tap out. |
| `data.card.rfidTag` | string | UID kartu. |
| `data.card.isInside` | boolean | Status kartu setelah tap. |
| `data.card.user.name` | string/null | Nama user jika kartu terhubung user. |
| `data.bus.passengerCount` | number | Jumlah penumpang terbaru. |
| `message` | string | Pesan backend. |

Perilaku firmware saat sukses:

- Jika `data.action == "TAP_IN"`, bunyi sukses 1x dan tampilkan `IN`.
- Jika `data.action == "TAP_OUT"`, bunyi sukses 2x dan tampilkan `OUT`.
- Tampilkan nama user jika ada.
- Tampilkan passenger count terbaru jika ada LCD/Serial.
- Boleh publish MQTT tap event opsional dengan action dari `data.action`.

### 7.3 Response Error HTTP Tap

Format error standar:

```json
{
  "success": false,
  "data": null,
  "message": "Bus is full",
  "meta": {
    "passengerCount": 50,
    "maxPassengers": 50
  },
  "errors": [
    {
      "key": "BUS_FULL",
      "field": "busId",
      "message": "Bus is full"
    }
  ]
}
```

Error key yang harus ditangani firmware:

| HTTP Status | `errors[0].key` | Arti | Perilaku Firmware |
| ---: | --- | --- | --- |
| `400` | `VALIDATION_ERROR` | Payload salah. | Tampilkan error, cek format JSON. Jangan retry cepat. |
| `401` | `UNAUTHORIZED` | `deviceKey` salah. | Tampilkan device unauthorized. Jangan retry terus-menerus. |
| `403` | `FORBIDDEN` | Device tidak terhubung ke bus tersebut. | Tampilkan bus/device mismatch. Jangan retry terus-menerus. |
| `404` | `NOT_FOUND` | Kartu atau bus tidak ditemukan. | Tampilkan kartu tidak terdaftar atau bus tidak ditemukan. |
| `405` | `METHOD_NOT_ALLOWED` | Method bukan POST. | Bug firmware endpoint/method. |
| `409` | `INVALID_TAP_OUT_BUS` | Tap out di bus berbeda. | Tolak tap, bunyi gagal. |
| `409` | `BUS_FULL` | Bus penuh. | Tolak tap in, bunyi gagal. |
| `409` | `INSUFFICIENT_BALANCE` | Saldo kurang. | Tolak tap in, bunyi gagal. |
| `500` | `INTERNAL_SERVER_ERROR` | Error server. | Boleh retry terbatas. |

Perilaku firmware saat error:

- Bunyi gagal.
- LED error menyala singkat.
- Tampilkan `message` atau `errors[0].message`.
- Jangan publish MQTT tap event jika HTTP tap gagal.
- Untuk error `401`, `403`, `400`, dan `409`, jangan auto retry karena bisa menyebabkan tap ganda atau spam server.
- Untuk network timeout atau HTTP `500`, boleh simpan ke queue retry terbatas, tetapi harus ada idempotency lokal agar kartu yang sama tidak dikirim berkali-kali dalam waktu dekat.

## 8. Variabel Runtime yang Perlu Ada di Firmware

| Nama Variabel | Tipe | Initial Value | Fungsi |
| --- | --- | --- | --- |
| `lastLatitude` | `double` | `0` | Latitude GPS valid terakhir. |
| `lastLongitude` | `double` | `0` | Longitude GPS valid terakhir. |
| `lastSpeedKmph` | `double` | `0` | Kecepatan GPS terakhir. |
| `lastGpsTime` | `String` | `""` | Waktu GPS terakhir. |
| `gpsHasFix` | `bool` | `false` | Apakah GPS valid. |
| `currentBusStatus` | `String` | `"IN_TRANSIT"` | Status dari MQTT status. |
| `currentStationName` | `String` | `"-"` | Nama halte dari MQTT status. |
| `lastLocationPublishAt` | `unsigned long` | `0` | Timer publish lokasi. |
| `lastWifiReconnectAt` | `unsigned long` | `0` | Timer reconnect WiFi. |
| `lastMqttReconnectAt` | `unsigned long` | `0` | Timer reconnect MQTT. |
| `lastRfidTag` | `String` | `""` | UID terakhir untuk debounce. |
| `lastRfidReadAt` | `unsigned long` | `0` | Waktu baca UID terakhir. |
| `RFID_DEBOUNCE_MS` | `unsigned long` | `3000` | Anti double tap kartu yang sama. |

## 9. Struktur Fungsi `.ino` yang Disarankan

Gunakan struktur fungsi berikut agar kode rapi.

| Fungsi | Tanggung Jawab |
| --- | --- |
| `setup()` | Init Serial, pinMode, WiFi, MQTT, GPS serial, RFID SPI. |
| `loop()` | Menjaga koneksi, membaca GPS, membaca RFID, publish lokasi berkala, menjalankan `mqttClient.loop()`. |
| `connectWiFi()` | Connect/reconnect WiFi. |
| `connectMqtt()` | Connect/reconnect MQTT dan subscribe status topic. |
| `mqttCallback(char* topic, byte* payload, unsigned int length)` | Parse payload status dari backend. |
| `readGps()` | Update koordinat GPS valid terakhir. |
| `publishLocation()` | Publish JSON lokasi ke MQTT. |
| `readRfid()` | Baca kartu, debounce, lalu panggil `sendTapTransaction()`. |
| `sendTapTransaction(String rfidTag)` | Kirim HTTP POST tap RFID. |
| `publishTapEvent(String action, String rfidTag)` | Publish MQTT tap opsional setelah HTTP sukses. |
| `beepSuccess(String action)` | Feedback sukses. |
| `beepError()` | Feedback gagal. |
| `setLedStatus()` | Update LED WiFi/MQTT/sukses/error. |

## 10. Pseudocode Firmware

```cpp
void setup() {
  Serial.begin(115200);

  setupPins();
  setupGps();
  setupRfid();

  connectWiFi();
  setupMqtt();
  connectMqtt();
}

void loop() {
  connectWiFi();
  connectMqtt();
  mqttClient.loop();

  readGps();
  readRfid();

  if (millis() - lastLocationPublishAt >= LOCATION_PUBLISH_INTERVAL_MS) {
    publishLocation();
    lastLocationPublishAt = millis();
  }
}
```

## 11. Contoh JSON ArduinoJson

### 11.1 Membuat Payload Lokasi

```cpp
StaticJsonDocument<512> doc;
doc["busId"] = BUS_ID;
doc["imei"] = DEVICE_SERIAL;
doc["bus_number"] = BUS_CODE;
doc["plate_number"] = PLATE_NUMBER;
doc["lat"] = lastLatitude;
doc["lng"] = lastLongitude;
doc["speed"] = lastSpeedKmph;
doc["gps_time"] = lastGpsTime;
doc["current_halte"] = currentStationName;
doc["message"] = gpsHasFix ? "GPS fix" : "GPS not fixed";
doc["firmware_version"] = FIRMWARE_VERSION;
doc["timestamp_ms"] = millis();

char buffer[512];
serializeJson(doc, buffer);
mqttClient.publish(mqttLocationTopic.c_str(), buffer);
```

### 11.2 Membuat Payload HTTP Tap

```cpp
StaticJsonDocument<384> doc;
doc["rfidTag"] = rfidTag;
doc["busId"] = BUS_ID;
doc["deviceKey"] = DEVICE_KEY;

if (gpsHasFix) {
  doc["latitude"] = lastLatitude;
  doc["longitude"] = lastLongitude;
}

doc["stationName"] = currentStationName;

String body;
serializeJson(doc, body);
```

### 11.3 Parse MQTT Status

```cpp
StaticJsonDocument<256> doc;
DeserializationError error = deserializeJson(doc, payloadString);

if (!error) {
  const char* busId = doc["busId"] | "";
  if (String(busId) == BUS_ID) {
    currentBusStatus = String((const char*) doc["status"] | "IN_TRANSIT");
    currentStationName = String((const char*) doc["stationName"] | "-");
  }
}
```

### 11.4 Parse Response HTTP Tap

```cpp
StaticJsonDocument<1024> doc;
DeserializationError error = deserializeJson(doc, responseBody);

if (!error && doc["success"] == true) {
  String action = String((const char*) doc["data"]["action"] | "UNKNOWN");
  int passengerCount = doc["data"]["bus"]["passengerCount"] | -1;
  beepSuccess(action);
  publishTapEvent(action, rfidTag);
} else {
  String errorKey = String((const char*) doc["errors"][0]["key"] | "UNKNOWN_ERROR");
  String message = String((const char*) doc["message"] | "Tap failed");
  beepError();
}
```

## 12. Timing dan Interval

| Kebutuhan | Rekomendasi | Keterangan |
| --- | ---: | --- |
| Publish lokasi | `3000 ms` | Cukup realtime tanpa terlalu membebani broker. |
| MQTT reconnect | `5000 ms` | Jangan reconnect di setiap loop. |
| WiFi reconnect | `5000 ms` | Jangan reconnect di setiap loop. |
| RFID debounce kartu sama | `3000 ms` | Mencegah tap ganda karena kartu ditempel lama. |
| HTTP timeout | `10000 ms` | Hindari firmware hang terlalu lama. |
| Buzzer sukses tap in | `1 beep` | Misal 100 ms. |
| Buzzer sukses tap out | `2 beep` | Misal 2x 80 ms. |
| Buzzer gagal | `1 beep panjang` | Misal 500 ms. |

## 13. Aturan Debounce RFID

Firmware harus mencegah kartu yang sama dikirim berkali-kali saat masih menempel di reader.

Rekomendasi:

- Simpan `lastRfidTag` dan `lastRfidReadAt`.
- Jika UID sama dan belum lewat `RFID_DEBOUNCE_MS`, abaikan.
- Jika UID berbeda, proses langsung.
- Setelah HTTP selesai, tetap tahan debounce sampai interval habis.

Contoh logika:

```cpp
if (rfidTag == lastRfidTag && millis() - lastRfidReadAt < RFID_DEBOUNCE_MS) {
  return;
}

lastRfidTag = rfidTag;
lastRfidReadAt = millis();
sendTapTransaction(rfidTag);
```

## 14. Queue dan Retry

Untuk tap RFID, hati-hati dengan retry karena bisa menyebabkan transaksi ganda.

Rekomendasi minimal:

- Jika HTTP mendapat response valid dengan `success=false`, jangan retry otomatis.
- Jika error network sebelum server menerima request, boleh retry maksimal 1-3 kali.
- Simpan UID, waktu, latitude, longitude, dan stationName saat retry.
- Jangan retry jika kartu yang sama sudah berhasil setelahnya.
- Gunakan jeda retry, misalnya `5000 ms`.

Untuk publish lokasi MQTT:

- Tidak perlu queue panjang.
- Jika MQTT disconnected, skip publish sampai reconnect.
- Lokasi terbaru lebih penting daripada lokasi lama.

## 15. Checklist Implementasi `.ino`

- Pin RFID sesuai dengan tabel pin.
- GPS serial memakai `Serial2` dengan RX `16`, TX `17`.
- WiFi connect dan auto reconnect.
- MQTT connect dan auto reconnect.
- Subscribe topic `/bus/tracking/status/{BUS_ID}`.
- Publish lokasi ke `/bus/tracking/location/{BUS_ID}`.
- Payload lokasi punya `busId`, `lat`, dan `lng`.
- RFID membaca UID sebagai string yang sama formatnya dengan `card.rfidTag` di database.
- HTTP tap mengirim `rfidTag`, `busId`, `deviceKey`, `latitude`, `longitude`, dan `stationName`.
- HTTP tap membaca `success`, `data.action`, dan error key.
- Debounce RFID aktif.
- Tidak publish MQTT tap jika HTTP tap gagal.
- Serial Monitor mencetak status koneksi dan error.
- Tidak menyimpan password/secret di repository publik.

## 16. Contoh Konfigurasi Backend yang Harus Cocok

Environment backend untuk HiveMQ Cloud:

```env
MQTT_BROKER_URL=mqtts://xxxxxxxxxxxx.s1.eu.hivemq.cloud:8883
MQTT_USERNAME=buswy_tracker
MQTT_PASSWORD=password-kuat
MQTT_TRACKING_TOPIC=/bus/tracking/location
MQTT_STATUS_TOPIC=/bus/tracking/status
MQTT_TOPIC=/bus/tracking/location
MQTT_TAP_TOPIC=bus/tracking/tap
```

Catatan backend:

- Pakai `mqtts://` karena backend terhubung ke HiveMQ Cloud via MQTT TLS.
- Jangan pakai `wss://...:8884/mqtt` untuk `MQTT_BROKER_URL` backend kecuali memang ingin koneksi WebSocket dari Node.js.
- `MQTT_TRACKING_TOPIC`, `MQTT_TOPIC`, dan `MQTT_LOCATION_TOPIC_BASE` firmware harus menunjuk base topic yang sama.
- `MQTT_STATUS_TOPIC` backend dan `MQTT_STATUS_TOPIC_BASE` firmware harus sama agar ESP32 menerima status geofence.

Kecocokan dengan firmware:

| Backend Env | Firmware Variable | Harus Sama? |
| --- | --- | --- |
| `MQTT_BROKER_URL` host/port | `MQTT_HOST`, `MQTT_PORT` | Ya |
| `MQTT_USERNAME` | `MQTT_USERNAME` | Ya jika broker pakai auth |
| `MQTT_PASSWORD` | `MQTT_PASSWORD` | Ya jika broker pakai auth |
| `MQTT_TRACKING_TOPIC` | `MQTT_LOCATION_TOPIC_BASE` | Ya |
| `MQTT_STATUS_TOPIC` | `MQTT_STATUS_TOPIC_BASE` | Ya |
| `MQTT_TAP_TOPIC` | `MQTT_TAP_TOPIC_BASE` | Ya jika publish tap MQTT |

## 17. Testing Manual Tanpa ESP32

Ganti nilai berikut sesuai HiveMQ Cloud milik project:

```text
HIVEMQ_HOST=xxxxxxxxxxxx.s1.eu.hivemq.cloud
HIVEMQ_PORT=8883
HIVEMQ_USERNAME=buswy_tracker
HIVEMQ_PASSWORD=password-kuat
```

Publish lokasi manual:

```bash
mosquitto_pub -h xxxxxxxxxxxx.s1.eu.hivemq.cloud -p 8883 --tls -u "buswy_tracker" -P "password-kuat" -t "/bus/tracking/location/cmogol00q0007bcvj5aa3lskf" -m '{"busId":"cmogol00q0007bcvj5aa3lskf","lat":-7.948766667,"lng":112.61636,"speed":5.0,"gps_time":"2026-05-16 05:03:42"}'
```

Subscribe status manual:

```bash
mosquitto_sub -h xxxxxxxxxxxx.s1.eu.hivemq.cloud -p 8883 --tls -u "buswy_tracker" -P "password-kuat" -t "/bus/tracking/status/#"
```

Test tap API manual:

```bash
curl -X POST "http://localhost:3000/api/bus/rfid/tap-transactions" \
  -H "Content-Type: application/json" \
  -d '{"rfidTag":"CARD-001","busId":"cmogol00q0007bcvj5aa3lskf","deviceKey":"device-secret-key","latitude":-7.948766667,"longitude":112.61636,"stationName":"Halte Politeknik Negeri Malang"}'
```

Publish tap MQTT opsional manual:

```bash
mosquitto_pub -h xxxxxxxxxxxx.s1.eu.hivemq.cloud -p 8883 --tls -u "buswy_tracker" -P "password-kuat" -t "bus/tracking/tap/cmogol00q0007bcvj5aa3lskf" -m '{"busId":"cmogol00q0007bcvj5aa3lskf","action":"TAP_IN","user":"CARD-001","stationName":"Halte Politeknik Negeri Malang","lat":-7.948766667,"lng":112.61636}'
```

## 18. Catatan Keamanan

- Jangan hardcode `DEVICE_KEY`, WiFi password, atau MQTT password di repo publik.
- Untuk produksi, gunakan MQTT TLS jika broker berada di internet.
- Buat `MQTT_CLIENT_ID` unik per device.
- Gunakan ACL broker agar device bus hanya boleh publish/subscribe topic bus miliknya.
- Jangan publish `DEVICE_KEY` lewat MQTT.
- `DEVICE_KEY` hanya dikirim ke HTTP API tap melalui jaringan yang aman.
- Jika backend pakai HTTPS, ESP32 harus memakai `WiFiClientSecure`.

## 19. Kontrak Minimum yang Tidak Boleh Dilanggar

Firmware dianggap kompatibel dengan Buswy jika memenuhi kontrak minimum ini:

1. Publish lokasi ke `/bus/tracking/location/{BUS_ID}`.
2. Payload lokasi berisi `busId`, `lat`, dan `lng` sebagai angka valid.
3. Subscribe status dari `/bus/tracking/status/{BUS_ID}`.
4. Kirim tap RFID ke `POST /api/bus/rfid/tap-transactions`.
5. Payload tap berisi `rfidTag`, `busId`, dan `deviceKey`.
6. Gunakan `stationName` dari MQTT status jika tersedia.
7. Jangan melakukan retry otomatis untuk error validasi/bisnis seperti saldo kurang, bus penuh, kartu tidak ditemukan, atau device unauthorized.
8. Jangan publish tap MQTT opsional sebelum HTTP tap sukses.
