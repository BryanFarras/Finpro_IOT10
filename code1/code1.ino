#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <TinyGPSPlus.h>

/*
  ESP32 pin mapping
  - DHT11 data    -> GPIO12 (add 10k pull-up to 3.3V)
  - MQ-2 analog   -> GPIO34 (ADC1_CH6, ensure analog voltage <= 3.3V via divider)
  - IR flame DO   -> GPIO13 (LOW = flame detected)
  - GPS TX (TXD)  -> GPIO16 (ESP32 RX2)
  - GPS RX (RXD)  -> GPIO17 (ESP32 TX2)
  - Water Pump    -> GPIO25 (HIGH = pump ON)
   Share a common ground across all modules.
*/  

const char* ssid = "Asususususus"; 
const char* password = "hahahaha";
const char* mqtt_server = "broker.emqx.io";
const char* DEVICE_ID = "esp32-node-1";   // ganti per board
const char* MQTT_BASE_TOPIC = "wokwi/project";

const int DHT_PIN = 12;
const int MQ2_PIN = 34;
const int FLAME_PIN = 13;
const int GPS_RX_PIN = 16;
const int GPS_TX_PIN = 17;
const int PUMP_PIN = 25;  

#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastSensorRead = 0;
const long sensorInterval = 5000;


bool pumpActive = false;
unsigned long pumpStartTime = 0;
const long pumpDuration = 10000;  

TinyGPSPlus gps;
HardwareSerial SerialGPS(1);

const bool PUMP_ACTIVE_LOW = true; // set true jika modul aktif saat pin = LOW

void setup_wifi() {
  delay(10);
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
}

void callback(char* topic, byte* payload, unsigned int length) {
  String messageTemp;
  for (int i = 0; i < length; i++) {
    messageTemp += (char)payload[i];
  }
  Serial.print("Pesan diterima [");
  Serial.print(topic);
  Serial.print("] ");
  Serial.println(messageTemp);
}

String buildTopic(const char* subTopic) {
  String topic = String(MQTT_BASE_TOPIC) + "/" + DEVICE_ID + "/" + subTopic;
  return topic;
}

void publishText(const char* subTopic, const char* payload) {
  String topic = buildTopic(subTopic);
  client.publish(topic.c_str(), payload);
}

void publishFloat(const char* subTopic, double value, uint8_t decimals) {
  char payload[32];
  snprintf(payload, sizeof(payload), "%.*f", decimals, value);
  publishText(subTopic, payload);
}

void publishInt(const char* subTopic, int value) {
  char payload[16];
  snprintf(payload, sizeof(payload), "%d", value);
  publishText(subTopic, payload);
}

void publishBool(const char* subTopic, bool value) {
  publishText(subTopic, value ? "1" : "0");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32-";
    clientId += DEVICE_ID;
    clientId += "-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      // Tidak ada topik kontrol yang diperlukan
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void processGPSStream() {
  while (SerialGPS.available() > 0) {
    gps.encode(SerialGPS.read());
  }
}

void readAndPublishDHT() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Serial.print("Suhu: "); Serial.print(t);
  Serial.print(" *C, Kelembapan: "); Serial.println(h);
  publishFloat("temp", t, 1);
  publishFloat("humidity", h, 1);
}

void readAndPublishMQ2() {
  int gasRaw = analogRead(MQ2_PIN);
  float gasVoltage = (gasRaw / 4095.0) * 3.3;

  Serial.print("MQ-2 raw: "); Serial.print(gasRaw);
  Serial.print(" (~"); Serial.print(gasVoltage, 2); Serial.println(" V)");
  publishInt("mq2/raw", gasRaw);
  publishFloat("mq2/voltage", gasVoltage, 2);
}

void readAndPublishFlame() {
  bool flameDetected = (digitalRead(FLAME_PIN) == LOW);

  Serial.print("Flame detected: ");
  Serial.println(flameDetected ? "YES" : "NO");
  publishBool("flame", flameDetected);
  
  if (flameDetected && !pumpActive) {
    activatePump();
  }
}

void readAndPublishGPS() {
  processGPSStream();
  bool gpsFix = gps.location.isValid();
  //const bool gpsFix = true;
  publishText("gps/status", gpsFix ? "fix" : "no-fix");
  if (!gpsFix) {
    Serial.println("GPS fix not available.");
    return;
  }
}

void activatePump() {
  pumpActive = true;
  pumpStartTime = millis();
  digitalWrite(PUMP_PIN, PUMP_ACTIVE_LOW ? LOW : HIGH);
  Serial.println("FLAME DETECTED! Water pump activated.");
  publishBool("pump", true);
}

void deactivatePump() {
  pumpActive = false;
  digitalWrite(PUMP_PIN, PUMP_ACTIVE_LOW ? HIGH : LOW);
  Serial.println("✓ Pump deactivated.");
  publishBool("pump", false);
}

void checkAndControlPump() {
  if (pumpActive) {
    unsigned long elapsedTime = millis() - pumpStartTime;
    if (elapsedTime >= pumpDuration) {
      deactivatePump();
    }
  }
}

void readSensorsAndPublish() {
  readAndPublishDHT();
  readAndPublishMQ2();
  readAndPublishFlame();
  readAndPublishGPS();
}

void setup() {
  Serial.begin(115200);

  pinMode(MQ2_PIN, INPUT);
  pinMode(FLAME_PIN, INPUT);
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);  
  
  dht.begin();

  SerialGPS.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("GPS serial initialized");
  
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop(); 
  processGPSStream();
  
  checkAndControlPump();

  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorRead >= sensorInterval) {
    lastSensorRead = currentMillis;
    readSensorsAndPublish();
  }
}