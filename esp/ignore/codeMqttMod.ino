#include <WiFi.h>
#include <PubSubClient.h>
#include <ModbusIP_ESP8266.h>
#include "Adafruit_VEML7700.h"
#include <PID_v1.h>

// === WIFI & MQTT ===
WiFiClient espClient;
PubSubClient client(espClient);

// === Modbus ===
ModbusIP mb;

// === Sensores & PID ===
Adafruit_VEML7700 veml = Adafruit_VEML7700();

int rawTDS, rawPH, rawTEMP;
double lux, pwmLight, setpoint = 100;
PID LUX_PID(&lux, &pwmLight, &setpoint, 0.1, 0.5, 0, DIRECT);

// === Pines ===
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

// === Timers ===
unsigned long t_now, t_last_air = 0, t_last_bomba[3] = {0,0,0};
bool air_state = false, bomba_state[3] = {false, false, false};

// === Configuración automática ===
int mode = 0;
int air_on_time = 180 * 1000;
int air_off_time = 3420 * 1000;
int bomba_sp[3] = {500, 500, 500};
int bomba_on_time[3] = {10 * 1000, 10 * 1000, 10 * 1000};
int bomba_off_time[3] = {300 * 1000, 300 * 1000, 300 * 1000};
int pwm_manual = 0;

// === Modbus mapping ===
#define COIL_AIR_PUMP 0
#define COIL_BOMBA_BASE 1
#define HREG_LIGHT_PWM 0
#define HREG_BOMBA_BASE 1
#define HREG_MODE 5
#define HREG_LUX_SP 6
#define HREG_AIR_ON_TIME 7
#define HREG_AIR_OFF_TIME 8
#define HREG_B1_SP 9
#define HREG_B1_ON_TIME 10
#define HREG_B1_OFF_TIME 11
#define HREG_B2_SP 12
#define HREG_B2_ON_TIME 13
#define HREG_B2_OFF_TIME 14
#define HREG_B3_SP 15
#define HREG_B3_ON_TIME 16
#define HREG_B3_OFF_TIME 17
#define IREG_TDS_RAW 0
#define IREG_PH_RAW 1
#define IREG_TEMP_RAW 2
#define IREG_LIGHT_LUX 3
#define IREG_LSL 4
#define IREG_LSH 5

void setup() {
  Serial.begin(115200);

  WiFi.begin("REHF-2.4G", "tontosYtorpes291");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("WiFi conectado. IP:");
  Serial.println(WiFi.localIP());

  client.setServer("192.168.4.4", 1883);  // broker MQTT
  client.setCallback(callback);

  mb.server();

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
    mb.addCoil(COIL_BOMBA_BASE + i, false);
    mb.addHreg(HREG_BOMBA_BASE + i, 0);
  }

  pinMode(AIR_PUMP_PIN, OUTPUT);
  mb.addCoil(COIL_AIR_PUMP, false);

  pinMode(LSL_PIN, INPUT);
  pinMode(LSH_PIN, INPUT);

  mb.addHreg(HREG_LIGHT_PWM, 0);
  mb.addHreg(HREG_MODE, mode);
  mb.addHreg(HREG_LUX_SP, setpoint);
  mb.addHreg(HREG_AIR_ON_TIME, air_on_time / 1000);
  mb.addHreg(HREG_AIR_OFF_TIME, air_off_time / 1000);

  for (int i=0; i<3; i++) {
    mb.addHreg(HREG_B1_SP + i*3, bomba_sp[i]);
    mb.addHreg(HREG_B1_ON_TIME + i*3, bomba_on_time[i]/1000);
    mb.addHreg(HREG_B1_OFF_TIME + i*3, bomba_off_time[i]/1000);
  }

  mb.addIreg(IREG_TDS_RAW, 0);
  mb.addIreg(IREG_PH_RAW, 0);
  mb.addIreg(IREG_TEMP_RAW, 0);
  mb.addIreg(IREG_LIGHT_LUX, 0);
  mb.addIreg(IREG_LSL, 0);
  mb.addIreg(IREG_LSH, 0);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();
  mb.task();
  t_now = millis();

  rawTDS = analogRead(TDS_PIN);
  rawPH = analogRead(PH_PIN);
  rawTEMP = analogRead(TEMP_PIN);
  lux = veml.readLux();

  mb.Ireg(IREG_TDS_RAW, rawTDS);
  mb.Ireg(IREG_PH_RAW, rawPH);
  mb.Ireg(IREG_TEMP_RAW, rawTEMP);
  mb.Ireg(IREG_LIGHT_LUX, (int)lux);
  mb.Ireg(IREG_LSL, digitalRead(LSL_PIN));
  mb.Ireg(IREG_LSH, digitalRead(LSH_PIN));

  mode = mb.Hreg(HREG_MODE);
  setpoint = mb.Hreg(HREG_LUX_SP);
  air_on_time = mb.Hreg(HREG_AIR_ON_TIME) * 1000;
  air_off_time = mb.Hreg(HREG_AIR_OFF_TIME) * 1000;

  for (int i=0; i<3; i++) {
    bomba_sp[i] = mb.Hreg(HREG_B1_SP + i*3);
    bomba_on_time[i] = mb.Hreg(HREG_B1_ON_TIME + i*3) * 1000;
    bomba_off_time[i] = mb.Hreg(HREG_B1_OFF_TIME + i*3) * 1000;
  }

  if ((mode == 1) && (digitalRead(LSL_PIN) == 0)) {
    controlAutomatico(rawTDS, rawPH);
  } else {
    controlManual();
  }
}

void controlManual() {
  for (int i = 0; i < 4; i++) {
    bool on = mb.Coil(COIL_BOMBA_BASE + i);
    int pwm = constrain(mb.Hreg(HREG_BOMBA_BASE + i), 0, 255);
    if (on && pwm > 0) {
      analogWrite(EN[i], pwm);
      digitalWrite(IN1[i], HIGH);
      digitalWrite(IN2[i], LOW);
    } else {
      analogWrite(EN[i], 0);
      digitalWrite(IN1[i], LOW);
      digitalWrite(IN2[i], LOW);
    }
  }
  digitalWrite(AIR_PUMP_PIN, mb.Coil(COIL_AIR_PUMP));
  int pwmLight = constrain(mb.Hreg(HREG_LIGHT_PWM), 0, 255);
  analogWrite(PWM_LIGHT_PIN, pwmLight);
}

void controlAutomatico(int tds, int ph) {
  LUX_PID.Compute();
  analogWrite(PWM_LIGHT_PIN, (int)pwmLight);

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
    if (client.connect("ESP32_ModbusMQTT")) {
      client.subscribe("ask/sensors");
    } else {
      delay(5000);
    }
  }
}
