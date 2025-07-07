#include <WiFi.h>
#include <PubSubClient.h>
#include "Adafruit_VEML7700.h"
#include <PID_v1.h>
#include <ArduinoJson.h>
#include <Preferences.h>

Preferences preferences;
Adafruit_VEML7700 veml = Adafruit_VEML7700();

const int NUM_GROUP = 3;

/* 
  ==================================================
  ==================== PINES
  ==================================================
*/
// const int PUMP_3_EN = 4, PUMP_3_IN1 = 17, PUMP_3_IN2 = 16; // son los pines del pump 1 que se dejo deshabilitado
const int LSL_PIN = 39, LSH_PIN = 36;
const int PUMP_0_EN = 19, PUMP_0_IN1 = 18, PUMP_0_IN2 = 5;   // PH
const int PUMP_1_EN = 26, PUMP_1_IN1 = 25, PUMP_1_IN2 = 33;  // EC1
const int PUMP_2_EN = 13, PUMP_2_IN1 = 14, PUMP_2_IN2 = 27;  // EC2
const int TDS_PIN = 34, PH_PIN = 35, TEMP_PIN = 32;
const int PWM_LUX_PIN = 23, AIR_PUMP_PIN = 3;

const int GROUP_EN[NUM_GROUP] = { PUMP_0_EN, PUMP_1_EN, PUMP_2_EN };
const int GROUP_IN1[NUM_GROUP] = { PUMP_0_IN1, PUMP_1_IN1, PUMP_2_IN1 };
const int GROUP_IN2[NUM_GROUP] = { PUMP_0_IN2, PUMP_1_IN2, PUMP_2_IN2 };
/* 
  ==================================================
  ===== VARIABLES SOLO DE LECTURA, SENSORES
  ==================================================
*/
// Nivel bajo y alto (0-1)
int IREG_LSL, IREG_LSH;
// EC, PH, TEMP (0-4095)
int IREG_TDS_RAW, IREG_PH_RAW, IREG_TEMP_RAW;
// Luz (0-65535)
int IREG_LUX;
// Estado de los componentes (0-1)
int STATUS_LUX = 0, STATUS_AIR = 0;
// Estado de los componentes (0-1)
int GROUP_STATUS_PUMP[NUM_GROUP] = { 0, 0, 0 };
unsigned long LAST_MS_AIR = 0;
unsigned long GROUP_LAST_MS_PUMP[NUM_GROUP] = { 0, 0, 0 };

/* 
  ==================================================
  ===== VARIABLES DE CONFIGURACION
  ==================================================
*/
// tipo de modo (0-1)
int HREG_MODE = 0;
// Permiso de activacion (0-1)
int COIL_LUX = 0, COIL_AIR_PUMP = 0;

// Pwm control (0-255)
int HREG_LUX_PWM = 0;
// Pwm setpoint (0-65535)
int HREG_LUX_SP = 100;
// Tiempo (on-off)
int HREG_ON_MS_AIR = 180 * 1000, HREG_OFF_MS_AIR = 3420 * 1000;

// Permiso de activacion (0-1)
int GROUP_COIL_PUMP[NUM_GROUP] = { 0, 0, 0 };
// Setpoint PH, EC1, EC2 (0-4095)
int GROUP_HREG_DOPING_SP[NUM_GROUP] = { 500, 500, 500 };
// PWM control (0-255)
int GROUP_HREG_PUMP[NUM_GROUP] = { 0, 0, 0 };
// Tiempo (on-off)
int GROUP_ON_MS_PUMP[NUM_GROUP] = { 10 * 1000, 10 * 1000, 10 * 1000 };
int GROUP_OFF_MS_PUMP[NUM_GROUP] = { 300 * 1000, 300 * 1000, 300 * 1000 };

// TIMERS
unsigned long CURRENT_TIME;

// PID
double D_LUX, D_PWM_LUX, D_LUX_SP;
PID LUX_PID(&D_LUX, &D_PWM_LUX, &D_LUX_SP, 0.1, 0.5, 0, DIRECT);

// WiFi y MQTT
WiFiClient espClient;
PubSubClient client(espClient);

/* 
  ==================================================
  ===== PROCESOS ARDUINO
  ==================================================
*/
void setup() {
  Serial.begin(115200);
  preferences.begin("controller", false);
  loadPreferences();

  WiFi.begin("ESP32_AP", "12345678");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("WiFi conectado. IP:");
  Serial.println(WiFi.localIP());

  client.setServer("192.168.4.100", 1883);
  client.setCallback(callback);

  Serial.println("MQTT conectado");

  veml.begin();
  veml.setLowThreshold(10000);
  veml.setHighThreshold(20000);
  veml.interruptEnable(true);

  LUX_PID.SetOutputLimits(0, 255);
  LUX_PID.SetMode(AUTOMATIC);

  for (int i = 0; i < NUM_GROUP; i++) {
    pinMode(GROUP_EN[i], OUTPUT);
    pinMode(GROUP_IN1[i], OUTPUT);
    pinMode(GROUP_IN2[i], OUTPUT);

    digitalWrite(GROUP_IN2[i], LOW);
  }

  pinMode(AIR_PUMP_PIN, OUTPUT);
  pinMode(LSL_PIN, INPUT);
  pinMode(LSH_PIN, INPUT);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  CURRENT_TIME = millis();
  D_LUX = veml.readLux();
  IREG_LUX = max((int)D_LUX, 0);
  IREG_TDS_RAW = analogRead(TDS_PIN);
  IREG_PH_RAW = analogRead(PH_PIN);
  IREG_TEMP_RAW = analogRead(TEMP_PIN);
  IREG_LSL = digitalRead(LSL_PIN);
  IREG_LSH = digitalRead(LSH_PIN);

  if ((HREG_MODE == 1) && (IREG_LSL == 0))
    controlAutomatico();
  else
    controlManual();
}

/* 
  ==================================================
  ===== CONTROL GENERAL
  ==================================================
*/
void controlManual() {
  // lux
  STATUS_LUX = (HREG_LUX_PWM > 0) ? 1 : 0;
  analogWrite(PWM_LUX_PIN, (COIL_LUX) ? HREG_LUX_PWM : 0);

  // air
  STATUS_AIR = COIL_AIR_PUMP;
  digitalWrite(AIR_PUMP_PIN, COIL_AIR_PUMP);

  // bumb
  for (int i = 0; i < NUM_GROUP; i++) {
    GROUP_STATUS_PUMP[i] = (GROUP_COIL_PUMP[i] && GROUP_HREG_PUMP[i]) ? 1 : 0;

    if (GROUP_STATUS_PUMP[i]) {
      analogWrite(GROUP_EN[i], GROUP_HREG_PUMP[i]);
      digitalWrite(GROUP_IN1[i], HIGH);
    } else {
      analogWrite(GROUP_EN[i], 0);
      digitalWrite(GROUP_IN1[i], LOW);
    }
  }
}

void controlAutomatico() {
  // lux
  D_LUX_SP = HREG_LUX_SP;
  LUX_PID.Compute();
  analogWrite(PWM_LUX_PIN, (int)D_PWM_LUX);
  unsigned long interval_lux = CURRENT_TIME - LAST_MS_AIR;
  STATUS_LUX = (D_PWM_LUX > 0) ? 1 : 0;

  // air
  if (STATUS_AIR) {
    if (interval_lux >= HREG_ON_MS_AIR) {
      STATUS_AIR = 0;
      LAST_MS_AIR = CURRENT_TIME;
    }
  } else {
    if (interval_lux >= HREG_OFF_MS_AIR) {
      STATUS_AIR = 1;
      LAST_MS_AIR = CURRENT_TIME;
    }
  }
  digitalWrite(AIR_PUMP_PIN, STATUS_AIR);

  // pump
  bool cond[NUM_GROUP] = {
    IREG_PH_RAW < GROUP_HREG_DOPING_SP[0],
    IREG_TDS_RAW < GROUP_HREG_DOPING_SP[1],
    IREG_TDS_RAW < GROUP_HREG_DOPING_SP[2]
  };

  for (int i = 0; i < NUM_GROUP; i++) {
    unsigned long interval = CURRENT_TIME - GROUP_LAST_MS_PUMP[i];

    if (GROUP_STATUS_PUMP[i]) {
      if (interval >= GROUP_ON_MS_PUMP[i]) {
        GROUP_STATUS_PUMP[i] = 0;
        GROUP_LAST_MS_PUMP[i] = CURRENT_TIME;
      }
    } else {
      if (cond[i] && (interval >= GROUP_OFF_MS_PUMP[i])) {
        GROUP_STATUS_PUMP[i] = 1;
        GROUP_LAST_MS_PUMP[i] = CURRENT_TIME;
      }
    }

    analogWrite(GROUP_EN[i], GROUP_STATUS_PUMP[i] ? 255 : 0);
    digitalWrite(GROUP_IN1[i], GROUP_STATUS_PUMP[i]);
  }
}

/* 
  ==================================================
  ===== CARGA DE BASE DE DATOS INTERNA
  ==================================================
*/
void loadPreferences() {
  HREG_MODE = preferences.getInt("HREG_MODE", HREG_MODE);

  COIL_LUX = preferences.getInt("COIL_LUX", COIL_LUX);
  COIL_AIR_PUMP = preferences.getInt("COIL_AIR_PUMP", COIL_AIR_PUMP);

  HREG_LUX_PWM = preferences.getInt("HREG_LUX_PWM", HREG_LUX_PWM);
  HREG_LUX_SP = preferences.getInt("HREG_LUX_SP", HREG_LUX_SP);
  HREG_ON_MS_AIR = preferences.getInt("HREG_ON_MS_AIR", HREG_ON_MS_AIR);
  HREG_OFF_MS_AIR = preferences.getInt("HREG_OFF_MS_AIR", HREG_OFF_MS_AIR);

  GROUP_COIL_PUMP[0] = preferences.getInt("COIL_PUMP_0", GROUP_COIL_PUMP[0]);
  GROUP_COIL_PUMP[1] = preferences.getInt("COIL_PUMP_1", GROUP_COIL_PUMP[1]);
  GROUP_COIL_PUMP[2] = preferences.getInt("COIL_PUMP_2", GROUP_COIL_PUMP[2]);

  GROUP_HREG_DOPING_SP[0] = preferences.getInt("HREG_DOPING_SP_0", GROUP_HREG_DOPING_SP[0]);
  GROUP_HREG_DOPING_SP[1] = preferences.getInt("HREG_DOPING_SP_1", GROUP_HREG_DOPING_SP[1]);
  GROUP_HREG_DOPING_SP[2] = preferences.getInt("HREG_DOPING_SP_2", GROUP_HREG_DOPING_SP[2]);

  GROUP_HREG_PUMP[0] = preferences.getInt("HREG_PUMP_0", GROUP_HREG_PUMP[0]);
  GROUP_HREG_PUMP[1] = preferences.getInt("HREG_PUMP_1", GROUP_HREG_PUMP[1]);
  GROUP_HREG_PUMP[2] = preferences.getInt("HREG_PUMP_2", GROUP_HREG_PUMP[2]);

  GROUP_ON_MS_PUMP[0] = preferences.getInt("HREG_B0_ON_MS", GROUP_ON_MS_PUMP[0]);
  GROUP_ON_MS_PUMP[1] = preferences.getInt("HREG_B1_ON_MS", GROUP_ON_MS_PUMP[1]);
  GROUP_ON_MS_PUMP[2] = preferences.getInt("HREG_B2_ON_MS", GROUP_ON_MS_PUMP[2]);

  GROUP_OFF_MS_PUMP[0] = preferences.getInt("HREG_B0_OFF_MS", GROUP_OFF_MS_PUMP[0]);
  GROUP_OFF_MS_PUMP[1] = preferences.getInt("HREG_B1_OFF_MS", GROUP_OFF_MS_PUMP[1]);
  GROUP_OFF_MS_PUMP[2] = preferences.getInt("HREG_B2_OFF_MS", GROUP_OFF_MS_PUMP[2]);
}

/* 
  ==================================================
  ===== JSON a STRING
  ==================================================
*/
void send_data_config() {
  StaticJsonDocument<1024> doc;
  // VARIABLES DE CONFIGURACION
  doc["HREG_MODE"] = HREG_MODE;

  doc["COIL_LUX"] = COIL_LUX;
  doc["COIL_AIR_PUMP"] = COIL_AIR_PUMP;

  doc["HREG_LUX_PWM"] = HREG_LUX_PWM;
  doc["HREG_LUX_SP"] = HREG_LUX_SP;
  doc["HREG_ON_MS_AIR"] = HREG_ON_MS_AIR;
  doc["HREG_OFF_MS_AIR"] = HREG_OFF_MS_AIR;

  doc["COIL_PUMP_0"] = GROUP_COIL_PUMP[0];
  doc["COIL_PUMP_1"] = GROUP_COIL_PUMP[1];
  doc["COIL_PUMP_2"] = GROUP_COIL_PUMP[2];

  doc["HREG_DOPING_SP_0"] = GROUP_HREG_DOPING_SP[0];
  doc["HREG_DOPING_SP_1"] = GROUP_HREG_DOPING_SP[1];
  doc["HREG_DOPING_SP_2"] = GROUP_HREG_DOPING_SP[2];

  doc["HREG_PUMP_0"] = GROUP_HREG_PUMP[0];
  doc["HREG_PUMP_1"] = GROUP_HREG_PUMP[1];
  doc["HREG_PUMP_2"] = GROUP_HREG_PUMP[2];

  doc["HREG_ON_MS_PUMP_0"] = GROUP_ON_MS_PUMP[0];
  doc["HREG_ON_MS_PUMP_1"] = GROUP_ON_MS_PUMP[1];
  doc["HREG_ON_MS_PUMP_2"] = GROUP_ON_MS_PUMP[2];

  doc["HREG_OFF_MS_PUMP_0"] = GROUP_OFF_MS_PUMP[0];
  doc["HREG_OFF_MS_PUMP_1"] = GROUP_OFF_MS_PUMP[1];
  doc["HREG_OFF_MS_PUMP_2"] = GROUP_OFF_MS_PUMP[2];

  char out[1024];
  serializeJson(doc, out);

  client.publish("control/REFRESH_DATA_CONFIG", out);
}

void send_data_stream() {
  StaticJsonDocument<1024> doc;
  // VARIABLES SOLO DE LECTURA, SENSORES
  doc["IREG_LSL"] = IREG_LSL;
  doc["IREG_LSH"] = IREG_LSH;

  doc["IREG_TDS_RAW"] = IREG_TDS_RAW;
  doc["IREG_PH_RAW"] = IREG_PH_RAW;
  doc["IREG_TEMP_RAW"] = IREG_TEMP_RAW;

  doc["IREG_LUX"] = IREG_LUX;
  doc["PWM_LUX"] = (int)D_PWM_LUX;

  doc["STATUS_LUX"] = STATUS_LUX;
  doc["STATUS_AIR"] = STATUS_AIR;

  doc["STATUS_PUMP_0"] = GROUP_STATUS_PUMP[0];
  doc["STATUS_PUMP_1"] = GROUP_STATUS_PUMP[1];
  doc["STATUS_PUMP_2"] = GROUP_STATUS_PUMP[2];

  doc["LAST_MS_AIR"] = LAST_MS_AIR;
  doc["LAST_MS_PUMP_0"] = GROUP_LAST_MS_PUMP[0];
  doc["LAST_MS_PUMP_1"] = GROUP_LAST_MS_PUMP[1];
  doc["LAST_MS_PUMP_2"] = GROUP_LAST_MS_PUMP[2];

  doc["CURRENT_TIME"] = CURRENT_TIME;

  char out[1024];
  serializeJson(doc, out);

  client.publish("control/REFRESH_DATA_STREAM", out);
}

void callback(char* topic, byte* payload, unsigned int length) {
  payload[length] = '\0';
  String t = topic;
  String msg = String((char*)payload);
  int rawValue = msg.toInt();
  int value = max(rawValue, 0);

  Serial.println(t);
  Serial.println(value);

  if (t == "control/REQ_DATA_STREAM") {
    send_data_stream();
  } else {

    if (t == "control/HREG_MODE") {
      preferences.putInt("HREG_MODE", (HREG_MODE = value == 0 ? 0 : 1));
    } else if (t == "control/COIL_LUX") {
      preferences.putInt("COIL_LUX", (COIL_LUX = value == 0 ? 0 : 1));
    } else if (t == "control/COIL_AIR_PUMP") {
      preferences.putInt("COIL_AIR_PUMP", (COIL_AIR_PUMP = value == 0 ? 0 : 1));
    }

    else if (t == "control/HREG_LUX_PWM") {
      preferences.putInt("HREG_LUX_PWM", (HREG_LUX_PWM = min(value, 255)));
    } else if (t == "control/HREG_LUX_SP") {
      preferences.putInt("HREG_LUX_SP", (HREG_LUX_SP = min(value, 65535)));
    } else if (t == "control/HREG_ON_MS_AIR") {
      preferences.putInt("HREG_ON_MS_AIR", (HREG_ON_MS_AIR = value));
    } else if (t == "control/HREG_OFF_MS_AIR") {
      preferences.putInt("HREG_OFF_MS_AIR", (HREG_OFF_MS_AIR = value));
    }

    else if (t == "control/COIL_PUMP_0") {
      preferences.putInt("COIL_PUMP_0", (GROUP_COIL_PUMP[0] = value == 0 ? 0 : 1));
    } else if (t == "control/COIL_PUMP_1") {
      preferences.putInt("COIL_PUMP_1", (GROUP_COIL_PUMP[1] = value == 0 ? 0 : 1));
    } else if (t == "control/COIL_PUMP_2") {
      preferences.putInt("COIL_PUMP_2", (GROUP_COIL_PUMP[2] = value == 0 ? 0 : 1));
    }

    else if (t == "control/HREG_DOPING_SP_0") {
      preferences.putInt("HREG_DOPING_SP_0", (GROUP_HREG_DOPING_SP[0] = min(value, 4095)));
    } else if (t == "control/HREG_DOPING_SP_1") {
      preferences.putInt("HREG_DOPING_SP_1", (GROUP_HREG_DOPING_SP[1] = min(value, 4095)));
    } else if (t == "control/HREG_DOPING_SP_2") {
      preferences.putInt("HREG_DOPING_SP_2", (GROUP_HREG_DOPING_SP[2] = min(value, 4095)));
    }

    else if (t == "control/HREG_PUMP_0") {
      preferences.putInt("HREG_PUMP_0", (GROUP_HREG_PUMP[0] = min(value, 255)));
    } else if (t == "control/HREG_PUMP_1") {
      preferences.putInt("HREG_PUMP_1", (GROUP_HREG_PUMP[1] = min(value, 255)));
    } else if (t == "control/HREG_PUMP_2") {
      preferences.putInt("HREG_PUMP_2", (GROUP_HREG_PUMP[2] = min(value, 255)));
    }

    else if (t == "control/HREG_B0_ON_MS") {
      preferences.putInt("HREG_B0_ON_MS", (GROUP_ON_MS_PUMP[0] = value * 1000));
    } else if (t == "control/HREG_B1_ON_MS") {
      preferences.putInt("HREG_B1_ON_MS", (GROUP_ON_MS_PUMP[1] = value * 1000));
    } else if (t == "control/HREG_B2_ON_MS") {
      preferences.putInt("HREG_B2_ON_MS", (GROUP_ON_MS_PUMP[2] = value * 1000));
    }

    else if (t == "control/HREG_B0_OFF_MS") {
      preferences.putInt("HREG_B0_OFF_MS", (GROUP_OFF_MS_PUMP[0] = value * 1000));
    } else if (t == "control/HREG_B1_OFF_MS") {
      preferences.putInt("HREG_B1_OFF_MS", (GROUP_OFF_MS_PUMP[1] = value * 1000));
    } else if (t == "control/HREG_B2_OFF_MS") {
      preferences.putInt("HREG_B2_OFF_MS", (GROUP_OFF_MS_PUMP[2] = value * 1000));
    }

    send_data_config();
  }
}

void reconnect() {
  while (!client.connected()) {
    if (!client.connect("ESP32_Client")) {
      delay(5000);
      continue;
    }

    client.subscribe("control/REQ_DATA_STREAM");
    client.subscribe("control/HREG_MODE");
    client.subscribe("control/COIL_LUX");
    client.subscribe("control/COIL_AIR_PUMP");
    client.subscribe("control/HREG_LUX_PWM");
    client.subscribe("control/HREG_LUX_SP");
    client.subscribe("control/HREG_ON_MS_AIR");
    client.subscribe("control/HREG_OFF_MS_AIR");

    client.subscribe("control/COIL_PUMP_0");
    client.subscribe("control/COIL_PUMP_1");
    client.subscribe("control/COIL_PUMP_2");

    client.subscribe("control/HREG_DOPING_SP_0");
    client.subscribe("control/HREG_DOPING_SP_1");
    client.subscribe("control/HREG_DOPING_SP_2");

    client.subscribe("control/HREG_PUMP_0");
    client.subscribe("control/HREG_PUMP_1");
    client.subscribe("control/HREG_PUMP_2");

    client.subscribe("control/HREG_B0_ON_MS");
    client.subscribe("control/HREG_B1_ON_MS");
    client.subscribe("control/HREG_B2_ON_MS");

    client.subscribe("control/HREG_B0_OFF_MS");
    client.subscribe("control/HREG_B1_OFF_MS");
    client.subscribe("control/HREG_B2_OFF_MS");
  }
}