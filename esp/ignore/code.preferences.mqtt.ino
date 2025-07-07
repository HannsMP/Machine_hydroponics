#include <WiFi.h>
#include <PubSubClient.h>
#include "Adafruit_VEML7700.h"
#include <PID_v1.h>
#include <ArduinoJson.h>
#include <Preferences.h>

Preferences preferences;
Adafruit_VEML7700 veml = Adafruit_VEML7700();

// Pines
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

// Variables persistentes
int COIL_AIR_PUMP;
int COIL_BOMBA_0;
int COIL_BOMBA_1;
int COIL_BOMBA_2;
int COIL_BOMBA_3;

int HREG_LIGHT_PWM;
int HREG_BOMBA_0;
int HREG_BOMBA_1;
int HREG_BOMBA_2;
int HREG_BOMBA_3; // 0-255
int HREG_MODE;
int HREG_LUX_SP;
int HREG_AIR_ON_TIME, HREG_AIR_OFF_TIME;
int HREG_B1_SP, HREG_B1_ON_TIME, HREG_B1_OFF_TIME;
int HREG_B2_SP, HREG_B2_ON_TIME, HREG_B2_OFF_TIME;
int HREG_B3_SP, HREG_B3_ON_TIME, HREG_B3_OFF_TIME;

// Sensores
int IREG_TDS_RAW, IREG_PH_RAW, IREG_TEMP_RAW;
int IREG_LIGHT_LUX, IREG_LSL, IREG_LSH;

// PID
double lux, pwmLight, setpoint;
PID LUX_PID(&lux, &pwmLight, &setpoint, 0.1, 0.5, 0, DIRECT);

// TIMERS
unsigned long t_now, t_last_air = 0, t_last_bomba[3] = {0,0,0};
bool air_state = false, bomba_state[3] = {false, false, false};

// WiFi y MQTT
WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  preferences.begin("controller", false);
  loadPreferences();

  WiFi.begin("ESP32_AP", "12345678");
  while (WiFi.status() != WL_CONNECTED) { 
    delay(500); Serial.print("."); 
  }
  Serial.println("WiFi conectado. IP:");
  Serial.println(WiFi.localIP());

  client.setServer("192.168.4.4", 1883);
  client.setCallback(callback);

  veml.begin();
  veml.setLowThreshold(10000);
  veml.setHighThreshold(20000);
  veml.interruptEnable(true);

  LUX_PID.SetOutputLimits(0, 255);
  LUX_PID.SetMode(AUTOMATIC);

  for (int i=0;i<4;i++) {
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

  IREG_TDS_RAW = analogRead(TDS_PIN);
  IREG_PH_RAW = analogRead(PH_PIN);
  IREG_TEMP_RAW = analogRead(TEMP_PIN);
  lux = veml.readLux();
  IREG_LIGHT_LUX = (int)lux;
  IREG_LSL = digitalRead(LSL_PIN);
  IREG_LSH = digitalRead(LSH_PIN);

  if ((HREG_MODE == 1) && (IREG_LSL==0)) 
    controlAutomatico(IREG_TDS_RAW, IREG_PH_RAW);
  else 
    controlManual();
}

// CONTROL MANUAL
void controlManual() {
  for (int i=0;i<4;i++) {
    if (COIL_BOMBA[i] && HREG_BOMBA[i] > 0) {
      analogWrite(EN[i], HREG_BOMBA[i]);
      digitalWrite(IN1[i], HIGH);
      digitalWrite(IN2[i], LOW);
    } else {
      analogWrite(EN[i], 0);
      digitalWrite(IN1[i], LOW);
      digitalWrite(IN2[i], LOW);
    }
  }
  digitalWrite(AIR_PUMP_PIN, COIL_AIR_PUMP);
  analogWrite(PWM_LIGHT_PIN, HREG_LIGHT_PWM);
}

// CONTROL AUTOMATICO
void controlAutomatico(int tds, int ph) {
  setpoint = HREG_LUX_SP;
  LUX_PID.Compute();
  analogWrite(PWM_LIGHT_PIN, (int)pwmLight);

  if (air_state && (t_now - t_last_air >= HREG_AIR_ON_TIME*1000)) {
    air_state = false; t_last_air = t_now;
  } else if (!air_state && (t_now - t_last_air >= HREG_AIR_OFF_TIME*1000)) {
    air_state = true; t_last_air = t_now;
  }
  digitalWrite(AIR_PUMP_PIN, air_state);

  int sp[3]={HREG_B1_SP,HREG_B2_SP,HREG_B3_SP};
  int on[3]={HREG_B1_ON_TIME*1000,HREG_B2_ON_TIME*1000,HREG_B3_ON_TIME*1000};
  int off[3]={HREG_B1_OFF_TIME*1000,HREG_B2_OFF_TIME*1000,HREG_B3_OFF_TIME*1000};

  for (int i=0;i<3;i++) {
    bool cond = (i<2) ? (tds<sp[i]) : (ph<sp[i]);
    if (bomba_state[i] && (t_now - t_last_bomba[i] >= on[i])) {
      bomba_state[i]=false; t_last_bomba[i]=t_now;
    } else if (!bomba_state[i] && cond && (t_now - t_last_bomba[i] >= off[i])) {
      bomba_state[i]=true; t_last_bomba[i]=t_now;
    }
    int pwm = bomba_state[i]?255:0;
    analogWrite(EN[i], pwm);
    digitalWrite(IN1[i], bomba_state[i]);
    digitalWrite(IN2[i], LOW);
  }
}

// MQTT
void callback(char* topic, byte* payload, unsigned int length) {
  payload[length] = '\0';
  String t = topic;
  String msg = String((char*)payload);

  if (t == "controller/COIL_AIR_PUMP") { 
    COIL_AIR_PUMP = msg.toInt();
    preferences.putInt("COIL_AIR_PUMP", COIL_AIR_PUMP); 
  }
  else if (t == "controller/HREG_LIGHT_PWM") { 
    HREG_LIGHT_PWM = msg.toInt();
    preferences.putInt("HREG_LIGHT_PWM", HREG_LIGHT_PWM); 
  }
  else if (t == "controller/HREG_MODE") { 
    HREG_MODE = msg.toInt();
    preferences.putInt("HREG_MODE", HREG_MODE); 
  }
  else if (t == "controller/HREG_LUX_SP") { 
    HREG_LUX_SP = msg.toInt();
    preferences.putInt("HREG_LUX_SP", HREG_LUX_SP); 
  }
  else if (t == "controller/HREG_AIR_ON_TIME") { 
    HREG_AIR_ON_TIME = msg.toInt();
    preferences.putInt("HREG_AIR_ON_TIME", HREG_AIR_ON_TIME); 
  }
  else if (t == "controller/HREG_AIR_OFF_TIME") { 
    HREG_AIR_OFF_TIME = msg.toInt();
    preferences.putInt("HREG_AIR_OFF_TIME", HREG_AIR_OFF_TIME); 
  }
  else if (t == "controller/HREG_B1_SP") { 
    HREG_B1_SP = msg.toInt();
    preferences.putInt("HREG_B1_SP", HREG_B1_SP); 
  }
  else if (t == "controller/HREG_B1_ON_TIME") { 
    HREG_B1_ON_TIME = msg.toInt();
    preferences.putInt("HREG_B1_ON_TIME", HREG_B1_ON_TIME); 
  }
  else if (t == "controller/HREG_B1_OFF_TIME") { 
    HREG_B1_OFF_TIME = msg.toInt();
    preferences.putInt("HREG_B1_OFF_TIME", HREG_B1_OFF_TIME); 
  }

  else if (t == "controller/HREG_B2_SP") { 
    HREG_B2_SP = msg.toInt();
    preferences.putInt("HREG_B2_SP", HREG_B2_SP); 
  }
  else if (t == "controller/HREG_B2_ON_TIME") { 
    HREG_B2_ON_TIME = msg.toInt();
    preferences.putInt("HREG_B2_ON_TIME", HREG_B2_ON_TIME); 
  }
  else if (t == "controller/HREG_B2_OFF_TIME") { 
    HREG_B2_OFF_TIME = msg.toInt();
    preferences.putInt("HREG_B2_OFF_TIME", HREG_B2_OFF_TIME); 
  }

  else if (t == "controller/HREG_B3_SP") { 
    HREG_B3_SP = msg.toInt();
    preferences.putInt("HREG_B3_SP", HREG_B3_SP); 
  }
  else if (t == "controller/HREG_B3_ON_TIME") { 
    HREG_B3_ON_TIME = msg.toInt();
    preferences.putInt("HREG_B3_ON_TIME", HREG_B3_ON_TIME); 
  }
  else if (t == "controller/HREG_B3_OFF_TIME") { 
    HREG_B3_OFF_TIME = msg.toInt();
    preferences.putInt("HREG_B3_OFF_TIME", HREG_B3_OFF_TIME); 
  }

  else if (t == "controller/get_state") {
    StaticJsonDocument<512> doc;
    doc["TDS"]=IREG_TDS_RAW;
    doc["PH"]=IREG_PH_RAW; 
    doc["TEMP"]=IREG_TEMP_RAW;
    doc["LUX"]=IREG_LIGHT_LUX; 
    doc["LSL"]=IREG_LSL; 
    doc["LSH"]=IREG_LSH;
    doc["AIR"]=COIL_AIR_PUMP; 
    doc["PWM_LIGHT"]=HREG_LIGHT_PWM;

    char out[512]; serializeJson(doc, out);
    
    client.publish("controller/state", out);
  }
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32_Client")) {
      client.subscribe("controller/COIL_AIR_PUMP");
      client.subscribe("controller/HREG_LIGHT_PWM");
      client.subscribe("controller/HREG_MODE");
      client.subscribe("controller/HREG_LUX_SP");
      client.subscribe("controller/HREG_AIR_ON_TIME");
      client.subscribe("controller/HREG_AIR_OFF_TIME");
      client.subscribe("controller/HREG_B1_SP");
      client.subscribe("controller/HREG_B1_ON_TIME");
      client.subscribe("controller/HREG_B1_OFF_TIME");
      client.subscribe("controller/HREG_B2_SP");
      client.subscribe("controller/HREG_B2_ON_TIME");
      client.subscribe("controller/HREG_B2_OFF_TIME");
      client.subscribe("controller/HREG_B3_SP");
      client.subscribe("controller/HREG_B3_ON_TIME");
      client.subscribe("controller/HREG_B3_OFF_TIME");
      client.subscribe("controller/get_state");
    } else {
      delay(5000);
    }
  }
}

// CARGAR DESDE FLASH
void loadPreferences() {
  COIL_AIR_PUMP = preferences.getInt("COIL_AIR_PUMP", 0);
  HREG_LIGHT_PWM = preferences.getInt("HREG_LIGHT_PWM", 0);
  HREG_MODE = preferences.getInt("HREG_MODE", 0);
  HREG_LUX_SP = preferences.getInt("HREG_LUX_SP", 100);
  HREG_AIR_ON_TIME = preferences.getInt("HREG_AIR_ON_TIME", 180);
  HREG_AIR_OFF_TIME = preferences.getInt("HREG_AIR_OFF_TIME", 3420);

  HREG_B1_SP = preferences.getInt("HREG_B1_SP", 500);
  HREG_B1_ON_TIME = preferences.getInt("HREG_B1_ON_TIME", 10);
  HREG_B1_OFF_TIME = preferences.getInt("HREG_B1_OFF_TIME", 300);

  HREG_B2_SP = preferences.getInt("HREG_B2_SP", 500);
  HREG_B2_ON_TIME = preferences.getInt("HREG_B2_ON_TIME", 10);
  HREG_B2_OFF_TIME = preferences.getInt("HREG_B2_OFF_TIME", 300);

  HREG_B3_SP = preferences.getInt("HREG_B3_SP", 500);
  HREG_B3_ON_TIME = preferences.getInt("HREG_B3_ON_TIME", 10);
  HREG_B3_OFF_TIME = preferences.getInt("HREG_B3_OFF_TIME", 300);
}