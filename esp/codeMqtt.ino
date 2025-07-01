#include <WiFi.h>
#include <PubSubClient.h>
#include "Adafruit_VEML7700.h"
#include <PID_v1.h>

Adafruit_VEML7700 veml = Adafruit_VEML7700();

WiFiClient espClient;
PubSubClient client(espClient);

// === SENSORES ===
int rawTDS, rawPH, rawTEMP;
double lux, pwmLight, setpoint = 100;

// === PID ===
PID LUX_PID(&lux, &pwmLight, &setpoint, 0.1, 0.5, 0, DIRECT);

// === PINES ===
const int LSL_PIN = 39;
const int LSH_PIN = 36;
const int EN[4]  = {19, 4, 26, 13};
const int IN1[4] = {18, 17, 25, 14};
const int IN2[4] = {5, 16, 33, 27};
const int TDS_PIN = 34;
const int PH_PIN = 35;
const int TEMP_PIN = 32;
const int PWM_LIGHT_PIN = 23;
const int AIR_PUMP_PIN = 3;

// === TIMERS ===
unsigned long t_now, t_last_air = 0, t_last_bomba[3] = {0,0,0};
bool air_state = false, bomba_state[3] = {false, false, false};

// === CONFIGURACION ===
int mode = 0;
int air_on_time = 180 * 1000;
int air_off_time = 3420 * 1000;
int bomba_sp[3] = {500, 500, 500};
int bomba_on_time[3] = {10 * 1000, 10 * 1000, 10 * 1000};
int bomba_off_time[3] = {300 * 1000, 300 * 1000, 300 * 1000};
int pwm_manual = 0;

void setup() {
  Serial.begin(115200);

  WiFi.begin("REHF-2.4G", "tontosYtorpes291");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("WiFi conectado. IP:");
  Serial.println(WiFi.localIP());

  client.setServer("192.168.1.100", 1883);  // Cambia por tu broker MQTT
  client.setCallback(callback);

  veml.begin();
  veml.setLowThreshold(10000);
  veml.setHighThreshold(20000);
  veml.interruptEnable(true);

  LUX_PID.SetOutputLimits(0, 255);
  LUX_PID.SetMode(AUTOMATIC);

  for (int i=0; i<4; i++) {
    pinMode(EN[i], OUTPUT);
    pinMode(IN1[i], OUTPUT);
    pinMode(IN2[i], OUTPUT);
  }
  pinMode(AIR_PUMP_PIN, OUTPUT);
  pinMode(LSL_PIN, INPUT);
  pinMode(LSH_PIN, INPUT);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  t_now = millis();
  
  rawTDS = analogRead(TDS_PIN);
  rawPH = analogRead(PH_PIN);
  rawTEMP = analogRead(TEMP_PIN);
  lux = veml.readLux();
  bool LSL = digitalRead(LSL_PIN);
  bool LSH = digitalRead(LSH_PIN);

  if ((mode == 1) && (LSL == 0)) {
    controlAutomatico(rawTDS, rawPH);
  } else {
    controlManual();
  }
}

void controlManual() {
  for (int i = 0; i < 4; i++) {
    analogWrite(EN[i], pwm_manual);
    digitalWrite(IN1[i], pwm_manual > 0);
    digitalWrite(IN2[i], LOW);
  }
  digitalWrite(AIR_PUMP_PIN, false);
  analogWrite(PWM_LIGHT_PIN, pwm_manual);
}

void controlAutomatico(int tds, int ph) {
  LUX_PID.Compute();
  analogWrite(PWM_LIGHT_PIN, (int)pwmLight);

  // Bomba de aire
  if (air_state && (t_now - t_last_air >= air_on_time)) {
    air_state = false; t_last_air = t_now;
  } else if (!air_state && (t_now - t_last_air >= air_off_time)) {
    air_state = true; t_last_air = t_now;
  }
  digitalWrite(AIR_PUMP_PIN, air_state);

  for (int i = 0; i < 3; i++) {
    bool cond = (i < 2) ? (tds < bomba_sp[i]) : (ph < bomba_sp[i]);
    if (bomba_state[i] && (t_now - t_last_bomba[i] >= bomba_on_time[i])) {
      bomba_state[i] = false; t_last_bomba[i] = t_now;
    } else if (!bomba_state[i] && cond && (t_now - t_last_bomba[i] >= bomba_off_time[i])) {
      bomba_state[i] = true; t_last_bomba[i] = t_now;
    }
    int pwm = bomba_state[i] ? 255 : 0;
    analogWrite(EN[i], pwm);
    digitalWrite(IN1[i], bomba_state[i]);
    digitalWrite(IN2[i], LOW);
  }
}

// === MQTT ===
void callback(char* topic, byte* message, unsigned int length) {
  String msg;
  for (uint i = 0; i < length; i++) msg += (char)message[i];

  if (String(topic) == "ask/sensors") {
    String json = "{";
    json += "\"TDS\":" + String(rawTDS) + ",";
    json += "\"PH\":" + String(rawPH) + ",";
    json += "\"TEMP\":" + String(rawTEMP) + ",";
    json += "\"LUX\":" + String(lux) + ",";
    json += "\"LSL\":" + String(digitalRead(LSL_PIN)) + ",";
    json += "\"LSH\":" + String(digitalRead(LSH_PIN));
    json += "}";
    client.publish("status/sensors", json.c_str());
  }
  else if (String(topic) == "control/mode") mode = msg.toInt();
  else if (String(topic) == "control/lux_sp") setpoint = msg.toDouble();
  else if (String(topic) == "control/air_on_time") air_on_time = msg.toInt() * 1000;
  else if (String(topic) == "control/air_off_time") air_off_time = msg.toInt() * 1000;
  else if (String(topic) == "control/b1_sp") bomba_sp[0] = msg.toInt();
  else if (String(topic) == "control/b1_on") bomba_on_time[0] = msg.toInt() * 1000;
  else if (String(topic) == "control/b1_off") bomba_off_time[0] = msg.toInt() * 1000;
  else if (String(topic) == "control/b2_sp") bomba_sp[1] = msg.toInt();
  else if (String(topic) == "control/b2_on") bomba_on_time[1] = msg.toInt() * 1000;
  else if (String(topic) == "control/b2_off") bomba_off_time[1] = msg.toInt() * 1000;
  else if (String(topic) == "control/b3_sp") bomba_sp[2] = msg.toInt();
  else if (String(topic) == "control/b3_on") bomba_on_time[2] = msg.toInt() * 1000;
  else if (String(topic) == "control/b3_off") bomba_off_time[2] = msg.toInt() * 1000;
  else if (String(topic) == "control/pwm_manual") pwm_manual = msg.toInt();
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32_Client")) {
      client.subscribe("ask/sensors");
      client.subscribe("control/mode");
      client.subscribe("control/lux_sp");
      client.subscribe("control/air_on_time");
      client.subscribe("control/air_off_time");
      client.subscribe("control/b1_sp");
      client.subscribe("control/b1_on");
      client.subscribe("control/b1_off");
      client.subscribe("control/b2_sp");
      client.subscribe("control/b2_on");
      client.subscribe("control/b2_off");
      client.subscribe("control/b3_sp");
      client.subscribe("control/b3_on");
      client.subscribe("control/b3_off");
      client.subscribe("control/pwm_manual");
    } else {
      delay(5000);
    }
  }
}