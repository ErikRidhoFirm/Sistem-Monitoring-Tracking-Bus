#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <MFRC522.h>
#include <TinyGPS++.h>

// --- KREDENSIAL ---
const char* ssid = "Free";
const char* password = "B@gusok55";

// MQTT
const char* mqtt_server = "16e6058923074678adb7fa8e5628865e.s1.eu.hivemq.cloud"; 
const int mqtt_port = 8883; 
const char* mqtt_user = "bagusok";
const char* mqtt_pass = "Bagusok55";

String mqtt_topic_location;
String mqtt_topic_tap;
String mqtt_topic_status;

// API
const char* api_url = "https://buswy.vercel.app/api/bus/rfid/tap-transactions";
const char* device_key = "4120795979d86b82c20a8335b699e7871ab4892ebbd328efaacdb73fc32ce633";
const char* bus_id = "cmogol00q0007bcvj5aa3lskf";

// PIN
const int PIN_RFID_SS = 5;
const int PIN_RFID_RST = 27;
const int PIN_BUZZER = 13;
const int PIN_GPS_RX = 16;
const int PIN_GPS_TX = 17;

// OBJECT
WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);
TinyGPSPlus gps;
Adafruit_SSD1306 oled(128, 64, &Wire, -1);
MFRC522 rfid(PIN_RFID_SS, PIN_RFID_RST);

// TIMER
unsigned long lastMqttMsg = 0;
unsigned long lastOledUpdate = 0;
String busStatus = "IN_TRANSIT";
String busStation = "-";

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, message);
  if (err) {
    return;
  }

  if (doc.containsKey("status")) {
    busStatus = doc["status"].as<String>();
  }

  if (doc.containsKey("stationName")) {
    busStation = doc["stationName"].as<String>();
  }
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  Wire.begin(21, 22);
  oled.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  oled.clearDisplay();
  oled.setTextColor(WHITE);
  oled.setCursor(0,10);
  oled.println("SYSTEM STARTING...");
  oled.display();

  Serial2.begin(9600, SERIAL_8N1, PIN_GPS_RX, PIN_GPS_TX);

  SPI.begin(18, 19, 23, PIN_RFID_SS); 
  rfid.PCD_Init();

  pinMode(PIN_BUZZER, OUTPUT);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  espClient.setInsecure(); 
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setBufferSize(512);
  mqttClient.setCallback(onMqttMessage);

  mqtt_topic_location = "bus/tracking/location/" + String(bus_id);
  mqtt_topic_tap = "bus/tracking/tap/" + String(bus_id);
  mqtt_topic_status = "bus/tracking/status/" + String(bus_id);
}

// ================= MQTT =================
void reconnectMQTT() {
  while (!mqttClient.connected()) {
    if (mqttClient.connect("ESP32_Bus_Device", mqtt_user, mqtt_pass)) {
      Serial.println("MQTT Connected");
      mqttClient.subscribe(mqtt_topic_status.c_str());
    } else {
      delay(5000);
    }
  }
}

// ================= MQTT TRANSACTION =================
void publishTransactionMQTT(String action, String name, String uid, float lat, float lng) {
  StaticJsonDocument<512> doc; // Ukuran diperbesar
  doc["busId"] = bus_id;
  doc["action"] = action;
  doc["user"] = (name != "" && name != "null") ? name : uid;
  doc["stationName"] = (busStation != "" && busStation != "null") ? busStation : "-";
  
  // Data Lokasi Detail saat Tap
  doc["lat"] = lat;
  doc["lng"] = lng;
  doc["speed"] = gps.speed.kmph();
  doc["sat"] = gps.satellites.value();
  doc["course"] = gps.course.deg();
  
  // Waktu Transaksi
  char timeBuf[20];
  sprintf(timeBuf, "%02d:%02d:%02d", gps.time.hour(), gps.time.minute(), gps.time.second());
  doc["time"] = timeBuf;
  
  doc["timestamp_ms"] = millis();

  char buffer[512];
  serializeJson(doc, buffer);

  mqttClient.publish(mqtt_topic_tap.c_str(), buffer);
}

// ================= HANDLE TAP =================
void handleTapTransaction(String uid) {
  if (WiFi.status() != WL_CONNECTED) return;

  // 🔥 FEEDBACK CEPAT KE USER
  oled.clearDisplay();
  oled.setCursor(0, 20);
  oled.println("PROCESSING...");
  oled.display();

  digitalWrite(PIN_BUZZER, HIGH); delay(150);
  digitalWrite(PIN_BUZZER, LOW);

  HTTPClient http;
  http.begin(api_url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> reqDoc;
  reqDoc["rfidTag"] = uid;
  reqDoc["busId"] = bus_id;
  reqDoc["deviceKey"] = device_key;
  reqDoc["latitude"] = gps.location.isValid() ? gps.location.lat() : 0.0;
  reqDoc["longitude"] = gps.location.isValid() ? gps.location.lng() : 0.0;
  reqDoc["stationName"] = (busStation != "" && busStation != "null") ? busStation : "-";

  String requestBody;
  serializeJson(reqDoc, requestBody);

  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    String response = http.getString();

    StaticJsonDocument<768> resDoc;
    deserializeJson(resDoc, response);

    if (resDoc["success"] == true) {
      String action = resDoc["data"]["action"].as<String>();
      String name = resDoc["data"]["card"]["user"]["name"].as<String>();

      float latTap = resDoc["data"]["transaction"]["latTap"].as<float>();
      float lngTap = resDoc["data"]["transaction"]["lngTap"].as<float>();

      oled.clearDisplay();
      oled.setCursor(0, 0);
      oled.println(action);
      oled.println("----------------");
      oled.setCursor(0, 30);
      oled.println((name != "" && name != "null") ? name : uid);
      oled.setCursor(0, 50);
      oled.print("Saldo: ");
      oled.println(resDoc["data"]["transaction"]["amount"].as<int>());
      oled.display();

      publishTransactionMQTT(action, name, uid, latTap, lngTap);

    } else {
      oled.clearDisplay();
      oled.println("TAP FAILED");
      oled.setCursor(0, 30);
      oled.println(resDoc["message"].as<String>());
      oled.display();
    }
  }

  http.end();

  // 🔧 DELAY DIPERCEPAT
  delay(1000);
}

// ================= OLED STATUS =================
void displaySystemStatus() {
  oled.clearDisplay();
  oled.setTextSize(1);

  oled.setCursor(0, 0);
  oled.print("WIFI:");
  oled.print(WiFi.status() == WL_CONNECTED ? "OK" : "OFF");
  oled.setCursor(70, 0);
  oled.print(gps.location.isValid() ? "GPS:FIX" : "GPS:WAIT");

  oled.setCursor(0, 16);
  oled.print("STATUS:");
  oled.print(busStatus);

  oled.setCursor(0, 30);
  oled.print("HALTE:");
  oled.print(busStation);

  oled.display();
}

// ================= LOOP =================
void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) reconnectMQTT();
    mqttClient.loop();
  }

  while (Serial2.available() > 0) {
    gps.encode(Serial2.read());
  }

if (gps.location.isValid() && millis() - lastMqttMsg > 15000) {
    // Ukuran JSON ditingkatkan menjadi 256 agar muat banyak data
    StaticJsonDocument<256> doc;
    
    doc["busId"] = bus_id;
    doc["lat"] = gps.location.lat();
    doc["lng"] = gps.location.lng();
    doc["speed"] = gps.speed.kmph();      // Kecepatan dalam km/jam
    doc["alt"] = gps.altitude.meters();    // Ketinggian dalam meter
    doc["course"] = gps.course.deg();      // Arah (derajat)
    doc["sat"] = gps.satellites.value();   // Jumlah satelit
    doc["hdop"] = gps.hdop.hdop();         // Akurasi (HDOP)
    doc["valid"] = gps.location.isValid(); // Status validitas data

    // Mengambil Waktu dan Tanggal
    char dateTimeBuf[32];
    sprintf(dateTimeBuf, "%04d-%02d-%02d %02d:%02d:%02d", 
            gps.date.year(), gps.date.month(), gps.date.day(),
            gps.time.hour(), gps.time.minute(), gps.time.second());
    doc["datetime"] = dateTimeBuf;

    char buffer[256];
    serializeJson(doc, buffer);

    mqttClient.publish(mqtt_topic_location.c_str(), buffer);

    lastMqttMsg = millis();
}

  if (millis() - lastOledUpdate > 1000) {
    displaySystemStatus();
    lastOledUpdate = millis();
  }

  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      uid += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
      uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();

    handleTapTransaction(uid);

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }
}