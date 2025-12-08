#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <TinyGPSPlus.h>

struct Config {
  const char* ssid;
  const char* password;

  const char* mqtt_server;
  const int   mqtt_port;
  const char* device_id;
  const char* base_topic;

  int dht_pin;
  int mq2_pin;
  int flame_pin;
  int gps_rx;
  int gps_tx;
};

Config cfg = {
  "Asususususus",      // SSID WiFi
  "hahahaha",           // Password WiFi

  "broker.emqx.io",     // MQTT Broker
  1883,                 // MQTT Port
  "esp32-node-2",       // Device ID
  "wokwi/project",      // Base MQTT Topic

  2,    // DHT pin
  4,    // MQ2 analog pin
  5,    // Flame pin
  16,   // GPS RX pin
  17    // GPS TX pin
};

/* =============================================
   OBJECT SENSOR
   ============================================= */
#define DHT_TYPE DHT11
DHT dht(cfg.dht_pin, DHT_TYPE);

TinyGPSPlus gps;
HardwareSerial SerialGPS(1);

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastSensorRead = 0;
const long sensorInterval = 5000;

/* =============================================
   WIFI SETUP
   ============================================= */
void setup_wifi() {
  Serial.print("Connecting to ");
  Serial.println(cfg.ssid);

  WiFi.begin(cfg.ssid, cfg.password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
}

/* =============================================
   MQTT UTILS
   ============================================= */

String buildTopic(const char* subTopic) {
  return String(cfg.base_topic) + "/" + cfg.device_id + "/" + subTopic;
}

void publishText(const char* subTopic, const char* payload) {
  client.publish(buildTopic(subTopic).c_str(), payload);
}

void publishFloat(const char* subTopic, double value, uint8_t decimals) {
  char buf[32];
  snprintf(buf, sizeof(buf), "%.*f", decimals, value);
  publishText(subTopic, buf);
}

void publishInt(const char* subTopic, int value) {
  char buf[16];
  snprintf(buf, sizeof(buf), "%d", value);
  publishText(subTopic, buf);
}

void publishBool(const char* subTopic, bool value) {
  publishText(subTopic, value ? "1" : "0");
}

/* =============================================
   MQTT CALLBACK
   ============================================= */
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("[MQTT] Pesan dari ");
  Serial.println(topic);

  String msg;
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  Serial.println("Payload: " + msg);
}

/* =============================================
   MQTT RECONNECT
   ============================================= */
void reconnect() {
  while (!client.connected()) {
    Serial.print("Trying MQTT...");

    String clientId = String("ESP32-") + cfg.device_id + "-" + String(random(0xFFFF), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println(" connected!");
    } else {
      Serial.print(" failed, rc=");
      Serial.print(client.state());
      Serial.println(" retry 5s...");
      delay(5000);
    }
  }
}

/* =============================================
   SENSOR FUNCTIONS
   ============================================= */

void processGPSStream() {
  while (SerialGPS.available() > 0) {
    gps.encode(SerialGPS.read());
  }
}

void readAndPublishDHT() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("DHT gagal membaca data!");
    return;
  }

  Serial.printf("DHT → Temp: %.1f°C, Hum: %.1f%%\n", t, h);
  publishFloat("temp", t, 1);
  publishFloat("humidity", h, 1);
}

void readAndPublishMQ2() {
  int gasRaw = analogRead(cfg.mq2_pin);
  float voltage = (gasRaw / 4095.0) * 3.3;

  Serial.printf("MQ2 → Raw: %d, Volt: %.2f\n", gasRaw, voltage);
  publishInt("mq2/raw", gasRaw);
  publishFloat("mq2/voltage", voltage, 2);
}

void readAndPublishFlame() {
  bool flameDetected = (digitalRead(cfg.flame_pin) == LOW);

  Serial.print("Flame → ");
  Serial.println(flameDetected ? "Detected!" : "Safe");

  publishBool("flame", flameDetected);
}

void readAndPublishGPS() {
  bool fix = gps.location.isValid() && gps.location.lat() != 0;

  publishText("gps/status", fix ? "fix" : "no-fix");

  if (!fix) {
    Serial.println("GPS → No Fix");
    return;
  }

  double lat = gps.location.lat();
  double lon = gps.location.lng();

  Serial.printf("GPS → Lat: %.6f, Lon: %.6f\n", lat, lon);

  publishFloat("gps/latitude", lat, 6);
  publishFloat("gps/longitude", lon, 6);
}

void readSensorsAndPublish() {
  readAndPublishDHT();
  readAndPublishMQ2();
  readAndPublishFlame();
  readAndPublishGPS();
}

/* =============================================
   SETUP
   ============================================= */
void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(cfg.mq2_pin, INPUT);
  pinMode(cfg.flame_pin, INPUT);

  dht.begin();

  SerialGPS.begin(9600, SERIAL_8N1, cfg.gps_rx, cfg.gps_tx);

  setup_wifi();
  client.setServer(cfg.mqtt_server, cfg.mqtt_port);
  client.setCallback(callback);
}

/* =============================================
   LOOP
   ============================================= */
void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  processGPSStream();

  unsigned long now = millis();
  if (now - lastSensorRead >= sensorInterval) {
    lastSensorRead = now;
    readSensorsAndPublish();
  }
}
