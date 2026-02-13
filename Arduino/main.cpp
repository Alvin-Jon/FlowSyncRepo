#include <WiFi.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <LiquidCrystal.h>

// -------------------- Pin Configuration --------------------
#define TRIG_PIN 5
#define ECHO_PIN 18
#define FLOW_PIN 4
#define LEAK_PIN 34
#define PUMP_RELAY 25
#define WATER_SUPPLY_STATUS_PIN 35

// LCD parallel pins
#define LCD_RS 15
#define LCD_EN 2
#define LCD_D4 14
#define LCD_D5 27
#define LCD_D6 26
#define LCD_D7 33

LiquidCrystal lcd(LCD_RS, LCD_EN, LCD_D4, LCD_D5, LCD_D6, LCD_D7);

// -------------------- WiFi --------------------
const char* ssid = "Infinix Hot 40";
const char* password = "dontconnect";
const char* serverBaseURL = "https://flowsync-backend-3a1h.onrender.com";

// -------------------- MQTT Configuration --------------------
const char* mqtt_server = "0568342c30994f368c273f781658d9e8.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "Jonathan";
const char* mqtt_pass = "Alvinjon6";

WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

// -------------------- Tank Parameters --------------------
const float TANK_HEIGHT_CM = 17.0;
int MIN_LEVEL_PERCENT = 20;
int MAX_LEVEL_PERCENT = 85;

// -------------------- Global Variables --------------------
volatile int flowPulseCount = 0;
float flowRate = 0.0;
bool pumpState = false;
bool leakDetected = false;
bool autoPump = false;
bool autoSupplyCut = true;
bool waterSupplyStatus = true;

// Device ID
#define DEVICE_NAME "TANK_UNIT"
String deviceID;

// -------------------- Non-blocking Sensor Variables --------------------
unsigned long lastUltrasonicRead = 0;
const unsigned long ULTRASONIC_INTERVAL = 2000; // Reduced from 500ms to 2000ms
float lastValidLevel = 50.0;

// -------------------- Non-blocking WiFi Variables --------------------
unsigned long lastWiFiReconnectAttempt = 0;
const unsigned long WIFI_RECONNECT_INTERVAL = 10000;

// -------------------- LCD Optimization --------------------
String lastLine0 = "";
String lastLine1 = "";

// -------------------- Flow Sensor Interrupt --------------------
void IRAM_ATTR pulseCounter() {
  flowPulseCount++;
}

// -------------------- MQTT Callback --------------------
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("📩 MQTT received on ");
  Serial.print(topic);
  Serial.print(": ");
  Serial.println(message);

  String topicStr = String(topic);

  // Handle pump commands
  if (topicStr.endsWith("/pump")) {
    if (message == "pump_on" && !autoPump) {
      pumpState = true;
      digitalWrite(PUMP_RELAY, HIGH);
      Serial.println("✅ Pump turned ON (Manual)");
    } 
    else if (message == "pump_off" && !autoPump) {
      pumpState = false;
      digitalWrite(PUMP_RELAY, LOW);
      Serial.println("✅ Pump turned OFF (Manual)");
    }
    else if (autoPump) {
      Serial.println("⚠ Pump command ignored - Auto mode active");
    }
  }

  // Handle supply commands
  else if (topicStr.endsWith("/supply")) {
    if (message == "supply_on") {
      waterSupplyStatus = true;
      digitalWrite(WATER_SUPPLY_STATUS_PIN, LOW); // Inverse logic
      Serial.println("✅ Water supply turned ON");
    } 
    else if (message == "supply_off") {
      waterSupplyStatus = false;
      digitalWrite(WATER_SUPPLY_STATUS_PIN, HIGH); // Inverse logic
      
      // Turn off pump if supply is cut
      if (pumpState) {
        pumpState = false;
        digitalWrite(PUMP_RELAY, LOW);
        Serial.println("⚠ Pump turned OFF due to supply cutoff");
      }
      Serial.println("✅ Water supply turned OFF");
    }
  }

  // Handle automation config
  else if (topicStr.endsWith("/automation")) {
    DynamicJsonDocument doc(256);
    DeserializationError error = deserializeJson(doc, message);
    
    if (!error) {
      if (doc.containsKey("auto_pump")) {
        autoPump = doc["auto_pump"].as<bool>();
        Serial.printf("✅ Auto Pump: %s\n", autoPump ? "ON" : "OFF");
      }
      if (doc.containsKey("minLevel")) {
        MIN_LEVEL_PERCENT = doc["minLevel"].as<int>();
        Serial.printf("✅ Min Level: %d%%\n", MIN_LEVEL_PERCENT);
      }
      if (doc.containsKey("maxLevel")) {
        MAX_LEVEL_PERCENT = doc["maxLevel"].as<int>();
        Serial.printf("✅ Max Level: %d%%\n", MAX_LEVEL_PERCENT);
      }
    } else {
      Serial.println("❌ JSON parse error in automation message");
    }
  }
}

// -------------------- MQTT Reconnect --------------------
void reconnectMQTT() {
  static unsigned long lastAttempt = 0;
  
  // Only attempt reconnect every 5 seconds
  if (millis() - lastAttempt < 5000) {
    return;
  }
  lastAttempt = millis();

  if (!mqttClient.connected()) {
    Serial.print("🔌 Connecting to MQTT...");
    
    String clientId = deviceID;
    
    if (mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("✅ Connected!");
      
      // Subscribe to topics
      String baseTopic = "device/" + deviceID;
      mqttClient.subscribe((baseTopic + "/pump").c_str());
      mqttClient.subscribe((baseTopic + "/supply").c_str());
      mqttClient.subscribe((baseTopic + "/automation").c_str());
      
      Serial.println("✅ Subscribed to all topics");
      
      // Publish connection status
      mqttClient.publish((baseTopic + "/status").c_str(), "connected", true);
      
    } else {
      Serial.print("❌ Failed, rc=");
      Serial.println(mqttClient.state());
    }
  }
}

// -------------------- Setup --------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n🚀 Starting ESP32 Water Tank System...");

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LEAK_PIN, INPUT_PULLDOWN);
  pinMode(FLOW_PIN, INPUT_PULLUP);
  pinMode(PUMP_RELAY, OUTPUT);
  pinMode(WATER_SUPPLY_STATUS_PIN, OUTPUT);
  
  digitalWrite(WATER_SUPPLY_STATUS_PIN, !waterSupplyStatus ? HIGH : LOW);
  digitalWrite(PUMP_RELAY, LOW);

  lcd.begin(16, 2);
  lcd.print("Initializing...");

  // Generate Device ID
  uint64_t chipID = ESP.getEfuseMac();
  deviceID = String(DEVICE_NAME) + "_" +
             String((uint32_t)(chipID >> 32), HEX) +
             String((uint32_t)chipID, HEX);

  Serial.println("Device ID: " + deviceID);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  lcd.setCursor(0, 1);
  lcd.print("WiFi Connecting");

  unsigned long wifiStart = millis();
  Serial.print("📶 Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED && (millis() - wifiStart < 20000)) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("   IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("   RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    
    lcd.clear();
    lcd.print("WiFi Connected");
    
    // Initialize device with backend (HTTP - runs once)
    initializeDeviceWithBackend();
    
    // Setup MQTT
    espClient.setInsecure();
    mqttClient.setServer(mqtt_server, mqtt_port);
    mqttClient.setCallback(mqttCallback);
    mqttClient.setKeepAlive(60);
    mqttClient.setSocketTimeout(15);
    mqttClient.setBufferSize(1024); // Increase buffer size for larger payloads
    
    Serial.println("\n📡 MQTT Configuration:");
    Serial.printf("   Server: %s:%d\n", mqtt_server, mqtt_port);
    Serial.printf("   Device: %s\n", deviceID.c_str());
    
  } else {
    Serial.println("\n❌ WiFi Failed - continuing offline");
    lcd.clear();
    lcd.print("WiFi Failed");
  }

  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), pulseCounter, RISING);
  delay(1000);
  lcd.clear();
}

// -------------------- HTTP Backend Initialization (RUNS ONCE) --------------------
void initializeDeviceWithBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected - cannot initialize backend");
    return;
  }

  HTTPClient http;
  http.setTimeout(5000);
  String url = String(serverBaseURL) + "/esp32/data";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String jsonData = "{\"deviceId\":\"" + deviceID + "\"}";
  Serial.println("\n🔄 Initializing with backend...");

  int httpCode = http.POST(jsonData);

  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("✅ Backend response received");
    
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);

    if (!error && doc.containsKey("deviceStatus")) {
      JsonObject deviceStatus = doc["deviceStatus"];

      autoPump = deviceStatus["autoPump"] | autoPump;
      autoSupplyCut = deviceStatus["autoSupplyCut"] | autoSupplyCut;
      waterSupplyStatus = deviceStatus["watersupplyStatus"] | waterSupplyStatus;

      digitalWrite(WATER_SUPPLY_STATUS_PIN, !waterSupplyStatus ? HIGH : LOW);

      bool backendPump = deviceStatus["waterpumpStatus"] | pumpState;

      if (deviceStatus.containsKey("waterThreshold")) {
        JsonObject threshold = deviceStatus["waterThreshold"];
        MIN_LEVEL_PERCENT = threshold["minLevel"] | MIN_LEVEL_PERCENT;
        MAX_LEVEL_PERCENT = threshold["maxLevel"] | MAX_LEVEL_PERCENT;
      }

      if (!autoPump && backendPump != pumpState) {
        pumpState = backendPump;
        digitalWrite(PUMP_RELAY, pumpState ? HIGH : LOW);
      }

      Serial.println("✅ Backend initialized successfully");
      Serial.printf("   AutoPump: %s | Pump: %s | Supply: %s\n",
                    autoPump ? "ON" : "OFF",
                    pumpState ? "ON" : "OFF",
                    waterSupplyStatus ? "ON" : "OFF");
      Serial.printf("   Min: %d%% | Max: %d%%\n", MIN_LEVEL_PERCENT, MAX_LEVEL_PERCENT);
    } else {
      Serial.println("⚠ Backend response parse failed");
    }
  } else {
    Serial.printf("❌ Backend init failed - HTTP Code: %d\n", httpCode);
  }

  http.end();
}

// -------------------- Non-blocking WiFi Check --------------------
void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    unsigned long currentTime = millis();
    if (currentTime - lastWiFiReconnectAttempt >= WIFI_RECONNECT_INTERVAL) {
      Serial.println("📶 WiFi lost - reconnecting...");
      WiFi.disconnect();
      WiFi.begin(ssid, password);
      lastWiFiReconnectAttempt = currentTime;
    }
  } else if (lastWiFiReconnectAttempt != 0) {
    Serial.println("✅ WiFi reconnected!");
    lastWiFiReconnectAttempt = 0;
  }
}

// -------------------- Ultrasonic Sensor (Non-blocking, slower) --------------------
float getWaterLevelPercent() {
  unsigned long currentTime = millis();

  if (currentTime - lastUltrasonicRead >= ULTRASONIC_INTERVAL) {
    lastUltrasonicRead = currentTime;
    
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH, 15000);

    if (duration == 0) {
      lastValidLevel = 0;
    } else {
      float distanceCM = duration * 0.034 / 2;
      float waterHeight = TANK_HEIGHT_CM - distanceCM;

      if (waterHeight <= 0) {
        lastValidLevel = 0;
      } else if (waterHeight >= TANK_HEIGHT_CM) {
        lastValidLevel = 100;
      } else {
        lastValidLevel = (waterHeight / TANK_HEIGHT_CM) * 100.0;
        lastValidLevel = constrain(lastValidLevel, 0.0, 100.0);
      }
    }
  }

  return lastValidLevel;
}

// -------------------- Flow Rate --------------------
float getFlowRate() {
  static unsigned long lastTime = 0;
  unsigned long currentTime = millis();

  if (currentTime - lastTime >= 1000) {
    noInterrupts();
    int count = flowPulseCount;
    flowPulseCount = 0;
    interrupts();

    flowRate = count / 7.5;
    lastTime = currentTime;
  }
  return flowRate;
}

// -------------------- Leak Detection --------------------
bool checkLeakage() {
  static unsigned long lastLeakCheck = 0;
  static int leakReadings = 0;
  static int sampleCount = 0;
  const unsigned long LEAK_CHECK_INTERVAL = 100;

  unsigned long currentTime = millis();

  if (currentTime - lastLeakCheck >= LEAK_CHECK_INTERVAL) {
    if (digitalRead(LEAK_PIN) == HIGH) {
      leakReadings++;
    }
    sampleCount++;
    lastLeakCheck = currentTime;

    if (sampleCount >= 5) {
      bool leak = (leakReadings >= 3);
      leakReadings = 0;
      sampleCount = 0;
      return leak;
    }
  }

  return leakDetected;
}

// -------------------- FIXED Pump Control (Auto Mode) --------------------
void controlPump(float waterLevel) {
  // If supply is off, turn off pump
  if (!waterSupplyStatus) {
    if (pumpState) {
      pumpState = false;
      digitalWrite(PUMP_RELAY, LOW);
      Serial.println("⚠ Pump OFF: Water supply cut off");
    }
    return;
  }

  // Auto mode logic
  if (autoPump) {
    // Turn ON when level drops BELOW minimum
    if (waterLevel < MIN_LEVEL_PERCENT && !pumpState) {
      pumpState = true;
      digitalWrite(PUMP_RELAY, HIGH);
      Serial.printf("🤖 Auto Pump ON - Level: %.1f%% (Min: %d%%)\n", waterLevel, MIN_LEVEL_PERCENT);
    } 
    // Turn OFF when level rises ABOVE maximum
    else if (waterLevel >= MAX_LEVEL_PERCENT && pumpState) {
      pumpState = false;
      digitalWrite(PUMP_RELAY, LOW);
      Serial.printf("🤖 Auto Pump OFF - Level: %.1f%% (Max: %d%%)\n", waterLevel, MAX_LEVEL_PERCENT);
    }
    // Between MIN and MAX: maintain current state (no action)
  } 
  // Manual mode - just maintain the state set via MQTT
  else {
    digitalWrite(PUMP_RELAY, pumpState ? HIGH : LOW);
  }
}

// -------------------- MQTT Publish Combined Data --------------------
void publishMQTTData(float level, float flow, bool leak) {
  if (!mqttClient.connected()) {
    Serial.println("⚠ MQTT not connected, skipping publish");
    return;
  }

  // Increase buffer size to handle larger payload
  DynamicJsonDocument doc(1024);
  
  doc["deviceId"] = deviceID;
  
  // Status data
  JsonObject status = doc.createNestedObject("statusData");
  status["waterLevel"] = round(level * 10) / 10.0;
  //status["pumpState"] = pumpState ? "on" : "off";
  status["supplyState"] = waterSupplyStatus ? "on" : "off";
  //status["autoMode"] = autoPump ? "on" : "off";
  
  JsonArray leakage = status.createNestedArray("leakage");
  JsonObject leakObj = leakage.createNestedObject();
  leakObj["detected"] = leak;
  leakObj["location"] = "tank";
  
  // Sensor data
  JsonObject sensors = doc.createNestedObject("sensorData");
  
  JsonArray tankSensor = sensors.createNestedArray("TankLevelSensor");
  JsonObject tank = tankSensor.createNestedObject();
  tank["description"] = "24KHz Ultrasonic";
  tank["active"] = true;
  
  JsonArray flowSensor = sensors.createNestedArray("FlowSensor");
  JsonObject flowObj = flowSensor.createNestedObject();
  flowObj["description"] = String(flow, 1) + "L/min";
  flowObj["active"] = flow > 0;
  
  JsonArray netSensor = sensors.createNestedArray("NetworkSensor");
  JsonObject net = netSensor.createNestedObject();
  net["description"] = String("WiFi ")+ ssid ;
  net["active"] = WiFi.status() == WL_CONNECTED;
  
  JsonArray leakSensor = sensors.createNestedArray("LeakSensor");
  JsonObject leakSensorObj = leakSensor.createNestedObject();
  leakSensorObj["description"] = leak ? "Detected" : "None";
  leakSensorObj["active"] = leak;

  String payload;
  size_t payloadSize = serializeJson(doc, payload);
  
  // Check payload size
  if (payloadSize > 800) {
    Serial.println("⚠ Payload too large: " + String(payloadSize) + " bytes");
    return;
  }
  
  String topic = "device/" + deviceID + "/data";
  
  // Use QoS 0 for better reliability with large payloads
  bool published = mqttClient.publish(topic.c_str(), payload.c_str(), false);
  
  if (published) {
    Serial.println("📤 MQTT published: " + String(payloadSize) + " bytes");
  } else {
    Serial.println("❌ MQTT publish failed (Size: " + String(payloadSize) + " bytes)");
    Serial.println("   Buffer state: " + String(mqttClient.state()));
  }
}

// -------------------- LCD Update --------------------
void updateLCD(float level, bool pump, bool leak) {
  String line0 = "TL:" + String(level, 0) + "% Pump:" + (pump ? "ON " : "OFF");
  String line1 = "FR:" + String(flowRate, 1) + " Leak:" + (leak ? "Yes" : "No");

  if (line0 != lastLine0) {
    lcd.setCursor(0, 0);
    lcd.print(line0);
    for (int i = line0.length(); i < 16; i++) {
      lcd.print(' ');
    }
    lastLine0 = line0;
  }

  if (line1 != lastLine1) {
    lcd.setCursor(0, 1);
    lcd.print(line1);
    for (int i = line1.length(); i < 16; i++) {
      lcd.print(' ');
    }
    lastLine1 = line1;
  }
}

// -------------------- Main Loop --------------------
void loop() {
  unsigned long currentTime = millis();

  // Check WiFi
  checkWiFiConnection();

  // Maintain MQTT connection (non-blocking)
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      reconnectMQTT();
    }
    mqttClient.loop(); // Handle incoming MQTT messages
  }

  // Read sensors
  float level = getWaterLevelPercent();
  float flow = getFlowRate();
  leakDetected = checkLeakage();

  // Control pump
  controlPump(level);

  // Publish MQTT data every 5 seconds (increased from 3s to reduce load)
  static unsigned long lastMQTTPublish = 0;
  if (currentTime - lastMQTTPublish >= 5000) {
    if (mqttClient.connected()) {
      publishMQTTData(level, flow, leakDetected);
    }
    lastMQTTPublish = currentTime;
  }

  // Update LCD
  updateLCD(level, pumpState, leakDetected);

  // Serial monitoring every 5 seconds
  static unsigned long lastSerialPrint = 0;
  if (currentTime - lastSerialPrint >= 5000) {
    Serial.printf("📊 Level: %.1f%% | Flow: %.1f L/min | Leak: %s | Pump: %s | Auto: %s | Supply: %s | MQTT: %s\n",
                  level, flow, 
                  leakDetected ? "YES" : "NO", 
                  pumpState ? "ON" : "OFF", 
                  autoPump ? "ON" : "OFF",
                  waterSupplyStatus ? "ON" : "OFF",
                  mqttClient.connected() ? "✅" : "❌");
    lastSerialPrint = currentTime;
  }

  delay(10); // Small delay to prevent watchdog issues
}

