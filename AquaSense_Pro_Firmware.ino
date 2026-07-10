/*
 * AquaSense Pro - Smart Aquarium ESP8266 Firmware
 * Compatible with NodeMCU 1.0 (ESP-12E Module)
 * 
 * Hardware Pins:
 * - DHT22: D2 (GPIO4)
 * - Buzzer/Relay Simulator: D5 (GPIO14)
 * 
 * Required Libraries:
 * - DHT sensor library by Adafruit
 * - Adafruit Unified Sensor (dependency of DHT library)
 * - ArduinoJson (v6 or v7)
 * - ESP8266 Board Package (v3.1.2)
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <time.h>

// WiFi Configuration
const char* ssid = "Your_WiFi_SSID";
const char* password = "Your_WiFi_Password";

// Firebase Configurations
#define FIREBASE_HOST "https://aquasense-pro-777ca-default-rtdb.asia-southeast1.firebasedatabase.app"
#define DEVICE_PATH "/devices/aquasense_001"

// Hardware Pin Definitions
#define DHTPIN 4          // NodeMCU D2 corresponds to GPIO4
#define DHTTYPE DHT22     // DHT22 Sensor Type
#define OUTPUT_PIN 14     // NodeMCU D5 corresponds to GPIO14

// Output Relay Logic Configuration
// For Buzzer testing: Active HIGH is used.
// To change to an active LOW relay module later, change this to LOW.
#define RELAY_ACTIVE HIGH 

// DHT22 Instance
DHT dht(DHTPIN, DHTTYPE);

// Secure WiFi Client (BearSSL)
WiFiClientSecure client;

// Application State Variables
String lightState = "OFF";
unsigned long lightOnStart = 0;

// Schedule Configuration Parameters
String scheduleOnTime = "12:00";
String scheduleOffTime = "18:00";
String scheduleMode = "continuous";
String scheduleEndDate = "";
String lastScheduledStatus = ""; // Caches last calculated schedule target ("ON"/"OFF")

// Timer tracking variables
unsigned long lastLightPoll = 0;
unsigned long lastSchedulePoll = 0;
unsigned long lastSensorUpload = 0;
unsigned long lastDeviceUpload = 0;
unsigned long lastDHTRead = 0;
unsigned long lastWiFiReconnect = 0;

// DHT Sensor cache
float currentTemp = NAN;
float currentHum = NAN;
int dhtConsecutiveFailures = 0;

// Function Prototypes
void setupWiFi();
void handleWiFi();
void setupNTP();
bool isTimeSynced();
bool isScheduleExpired(const char* endDateStr);
bool isLightTimeNow(const char* onTime, const char* offTime, const char* mode, const char* endDateStr);
time_t convertUTCtoEpoch(int y, int m, int d, int h, int min, int s);
void setOutputState(bool on);
void turnLight(const char* status, const char* reason);
void pollLightStatus();
void pollSchedule();
void readDHTAndUpload();
void uploadDeviceStatus();
void evaluateScheduleTimer();
String httpGet(const String& path);
bool httpPut(const String& path, const String& jsonPayload);

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n--- AquaSense Pro Firmware Booting ---");

  // Output Initialization
  pinMode(OUTPUT_PIN, OUTPUT);
  setOutputState(false); // Start turned OFF

  // Sensor Initialization
  dht.begin();

  // WiFi Setup
  setupWiFi();

  // BearSSL SSL Client configuration
  // Skip certification verification for lightweight memory consumption
  client.setInsecure();

  // NTP Time Synchronization Setup
  setupNTP();
}

void loop() {
  // Handle non-blocking WiFi reconnects
  handleWiFi();

  unsigned long currentMillis = millis();

  // 1. Poll light status from Firebase (every 800ms)
  if (currentMillis - lastLightPoll >= 800) {
    lastLightPoll = currentMillis;
    pollLightStatus();
  }

  // 2. Poll schedule parameters from Firebase (every 5000ms)
  if (currentMillis - lastSchedulePoll >= 5000) {
    lastSchedulePoll = currentMillis;
    pollSchedule();
  }

  // 3. Read DHT Sensor & Upload to Firebase (every 10000ms)
  if (currentMillis - lastDHTRead >= 10000) {
    lastDHTRead = currentMillis;
    readDHTAndUpload();
  }

  // 4. Upload device status & uptime heartbeat (every 15000ms)
  if (currentMillis - lastDeviceUpload >= 15000) {
    lastDeviceUpload = currentMillis;
    uploadDeviceStatus();
  }

  // 5. Evaluate schedule timer targets (every 1000ms)
  static unsigned long lastTimerCheck = 0;
  if (currentMillis - lastTimerCheck >= 1000) {
    lastTimerCheck = currentMillis;
    evaluateScheduleTimer();
  }

  // Yield to allow ESP8266 background tasks (WiFi, TCP) to complete
  yield();
}

// ----------------------------------------------------
// Hardware Control Abstraction
// ----------------------------------------------------
void setOutputState(bool on) {
  // Supports active HIGH/LOW logic based on constant
  if (on) {
    digitalWrite(OUTPUT_PIN, RELAY_ACTIVE);
  } else {
    digitalWrite(OUTPUT_PIN, !RELAY_ACTIVE);
  }
}

// ----------------------------------------------------
// Network and Time Setup
// ----------------------------------------------------
void setupWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(ssid, password);

  Serial.print("[WiFi] Connecting to: ");
  Serial.println(ssid);

  // Non-blocking connection check for max 10 seconds on boot
  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] Connection failed on startup. Will reconnect in background.");
  }
}

void handleWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    unsigned long currentMillis = millis();
    if (currentMillis - lastWiFiReconnect >= 10000) {
      lastWiFiReconnect = currentMillis;
      Serial.println("[WiFi] Reconnecting in background...");
      WiFi.begin(ssid, password);
    }
  }
}

void setupNTP() {
  // NTP Configuration for Sri Lanka timezone (UTC+5:30)
  // Offset = 5.5 hours * 3600 seconds = 19800 seconds. DST offset = 0.
  configTime(19800, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("[NTP] Clock Sync initiated...");
}

bool isTimeSynced() {
  time_t now = time(nullptr);
  // If time returns value greater than year 2001 (approx 1000000000 epoch), it is synced
  return (now > 1000000000);
}

// ----------------------------------------------------
// Schedule calculations
// ----------------------------------------------------
time_t convertUTCtoEpoch(int y, int m, int d, int h, int min, int s) {
  static const int daysInMonths[] = {0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334};
  time_t epoch = 0;
  
  // Calculate years
  for (int year = 1970; year < y; year++) {
    if ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)) {
      epoch += 366 * 86400;
    } else {
      epoch += 365 * 86400;
    }
  }
  
  // Calculate months
  epoch += daysInMonths[m - 1] * 86400;
  if (m > 2 && ((y % 4 == 0 && y % 100 != 0) || (y % 400 == 0))) {
    epoch += 86400; // Leap day in current year
  }
  
  epoch += (d - 1) * 86400;
  epoch += h * 3600;
  epoch += min * 60;
  epoch += s;
  
  return epoch;
}

bool isScheduleExpired(const char* endDateStr) {
  if (!endDateStr || strlen(endDateStr) == 0 || strcmp(endDateStr, "null") == 0) {
    return false;
  }

  int year, month, day, hour, minute, second;
  // Parse Firebase ISO string format: "2026-07-18T18:29:59.999Z"
  if (sscanf(endDateStr, "%d-%d-%dT%d:%d:%d", &year, &month, &day, &hour, &minute, &second) >= 3) {
    time_t endEpoch = convertUTCtoEpoch(year, month, day, hour, minute, second);
    time_t nowUTC = time(nullptr);
    return (nowUTC > endEpoch);
  }
  return false;
}

bool isLightTimeNow(const char* onTime, const char* offTime, const char* mode, const char* endDateStr) {
  if (strcmp(mode, "limited") == 0 && isScheduleExpired(endDateStr)) {
    return false; // Limited schedule expired
  }

  time_t now = time(nullptr);
  struct tm* timeInfo = localtime(&now);
  int currentMins = timeInfo->tm_hour * 60 + timeInfo->tm_min;

  int onHour, onMin, offHour, offMin;
  if (sscanf(onTime, "%d:%d", &onHour, &onMin) != 2) return false;
  if (sscanf(offTime, "%d:%d", &offHour, &offMin) != 2) return false;

  int onMins = onHour * 60 + onMin;
  int offMins = offHour * 60 + offMin;

  if (onMins < offMins) {
    // Normal daytime schedule (e.g., 08:00 - 18:00)
    return (currentMins >= onMins && currentMins < offMins);
  } else {
    // Overnight schedule (e.g., 18:00 - 06:00)
    return (currentMins >= onMins || currentMins < offMins);
  }
}

// ----------------------------------------------------
// Firebase Polling & Update Logic
// ----------------------------------------------------
void pollLightStatus() {
  if (WiFi.status() != WL_CONNECTED) return;

  String payload = httpGet(String(DEVICE_PATH) + "/light/status");
  if (payload.length() > 0) {
    payload.replace("\"", "");
    payload.trim();

    if (payload == "ON" || payload == "OFF") {
      if (lightState != payload) {
        lightState = payload;
        Serial.print("[Firebase] Status update fetched: ");
        Serial.println(lightState);

        if (lightState == "ON") {
          setOutputState(true);
          if (lightOnStart == 0) lightOnStart = millis();
        } else {
          setOutputState(false);
          lightOnStart = 0;
        }
      }
    }
  }
}

void pollSchedule() {
  if (WiFi.status() != WL_CONNECTED) return;

  String payload = httpGet(String(DEVICE_PATH) + "/schedule");
  if (payload.length() > 0 && payload != "null") {
    // ArduinoJson compatibility v6/v7
    #if ARDUINOJSON_VERSION_MAJOR >= 7
    JsonDocument doc;
    #else
    StaticJsonDocument<512> doc;
    #endif

    DeserializationError error = deserializeJson(doc, payload);
    if (!error) {
      bool configChanged = false;
      const char* onTime = doc["onTime"] | "12:00";
      const char* offTime = doc["offTime"] | "18:00";
      const char* mode = doc["mode"] | "continuous";
      const char* endDate = doc["endDate"] | "";

      if (scheduleOnTime != onTime || scheduleOffTime != offTime || scheduleMode != mode || scheduleEndDate != endDate) {
        configChanged = true;
        scheduleOnTime = onTime;
        scheduleOffTime = offTime;
        scheduleMode = mode;
        scheduleEndDate = endDate;
        
        Serial.println("[Firebase] Schedule configuration updated:");
        Serial.printf(" > ON Time : %s\n > OFF Time: %s\n > Mode    : %s\n > End Date: %s\n", 
                      scheduleOnTime.c_str(), scheduleOffTime.c_str(), scheduleMode.c_str(), scheduleEndDate.c_str());
      }

      if (configChanged) {
        lastScheduledStatus = ""; // Reset cache to force immediate evaluation
      }
    }
  }
}

void evaluateScheduleTimer() {
  if (!isTimeSynced()) return; // Wait until NTP clocks are ready

  bool targetOn = isLightTimeNow(scheduleOnTime.c_str(), scheduleOffTime.c_str(), scheduleMode.c_str(), scheduleEndDate.c_str());
  String targetStatus = targetOn ? "ON" : "OFF";

  // Transition Boundary Check (Triggers ONLY when expected state transitions)
  if (lastScheduledStatus != targetStatus) {
    lastScheduledStatus = targetStatus;
    
    // Update light if state differs to prevent overriding manual settings
    if (lightState != targetStatus) {
      Serial.printf("[Scheduler] Transition boundary triggered: Changing light to %s\n", targetStatus.c_str());
      turnLight(targetStatus.c_str(), "Timer");
    }
  }
}

void turnLight(const char* status, const char* reason) {
  lightState = status;
  setOutputState(strcmp(status, "ON") == 0);

  if (strcmp(status, "ON") == 0) {
    lightOnStart = millis();
  } else {
    lightOnStart = 0;
  }

  // Put update to Firebase
  if (WiFi.status() == WL_CONNECTED) {
    String payload = String("\"") + status + "\"";
    httpPut(String(DEVICE_PATH) + "/light/status", payload);
  }
  Serial.printf("[Buzzer] %s: State updated to %s\n", reason, status);
}

void readDHTAndUpload() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  if (isnan(temp) || isnan(hum)) {
    dhtConsecutiveFailures++;
    Serial.println("[DHT] Warning: Failed to read from DHT sensor.");
    
    if (dhtConsecutiveFailures >= 5) {
      Serial.println("[DHT] Error: Multiple consecutive failures. Uploading error status.");
      #if ARDUINOJSON_VERSION_MAJOR >= 7
      JsonDocument doc;
      #else
      StaticJsonDocument<256> doc;
      #endif
      doc["temperature"] = "ERR";
      doc["humidity"] = "ERR";
      doc["waterLevel"] = "--";

      String payload;
      serializeJson(doc, payload);
      httpPut(String(DEVICE_PATH) + "/sensors", payload);
    }
    return;
  }

  dhtConsecutiveFailures = 0;
  currentTemp = temp;
  currentHum = hum;

  Serial.printf("[DHT] Reading: Temperature: %.1f °C, Humidity: %.0f %%\n", temp, hum);

  #if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
  #else
  StaticJsonDocument<256> doc;
  #endif
  doc["temperature"] = serialized(String(temp, 1));
  doc["humidity"] = serialized(String(hum, 0));
  doc["waterLevel"] = "--"; // Mapped to "--" placeholder as requested

  String payload;
  serializeJson(doc, payload);
  httpPut(String(DEVICE_PATH) + "/sensors", payload);
}

void uploadDeviceStatus() {
  if (WiFi.status() != WL_CONNECTED) return;

  #if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
  #else
  StaticJsonDocument<512> doc;
  #endif

  doc["wifi"] = "Online";
  doc["rtc"] = isTimeSynced() ? "NTP Synced" : "Not Synced";
  doc["ip"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  doc["uptimeSeconds"] = millis() / 1000;
  doc["firmwareVersion"] = "1.2.0";

  time_t now = time(nullptr);
  struct tm* timeInfo = localtime(&now);

  char timeBuf[10];
  char fullTimeBuf[25];
  if (isTimeSynced()) {
    sprintf(timeBuf, "%02d:%02d", timeInfo->tm_hour, timeInfo->tm_min);
    sprintf(fullTimeBuf, "%04d-%02d-%02dT%02d:%02d:%02d", 
            timeInfo->tm_year + 1900, timeInfo->tm_mon + 1, timeInfo->tm_mday,
            timeInfo->tm_hour, timeInfo->tm_min, timeInfo->tm_sec);
  } else {
    strcpy(timeBuf, "--");
    strcpy(fullTimeBuf, "Not Synced");
  }

  doc["time"] = timeBuf; // Compatible with client UI "time" parameter
  doc["currentTime"] = fullTimeBuf;
  doc["lastSeen"] = fullTimeBuf;

  String payload;
  serializeJson(doc, payload);
  httpPut(String(DEVICE_PATH) + "/device", payload);
}

// ----------------------------------------------------
// Low-level HTTP BearSSL secure requests
// ----------------------------------------------------
String httpGet(const String& path) {
  HTTPClient http;
  http.setTimeout(4000);
  String url = String(FIREBASE_HOST) + path + ".json";
  
  if (http.begin(client, url)) {
    int httpCode = http.GET();
    if (httpCode == HTTP_CODE_OK) {
      String payload = http.getString();
      http.end();
      return payload;
    }
    http.end();
  }
  return "";
}

bool httpPut(const String& path, const String& jsonPayload) {
  HTTPClient http;
  http.setTimeout(4000);
  String url = String(FIREBASE_HOST) + path + ".json";
  
  if (http.begin(client, url)) {
    http.addHeader("Content-Type", "application/json");
    int httpCode = http.PUT(jsonPayload);
    http.end();
    return (httpCode == HTTP_CODE_OK || httpCode == 201 || httpCode == 204);
  }
  return false;
}
