#include <WiFi.h>
#include <ModbusIP_ESP8266.h>
#include "Adafruit_VEML7700.h"
#include <PID_v1.h>

Adafruit_VEML7700 veml = Adafruit_VEML7700();

int rawTDS;
int rawPH;
int rawTEMP;

// Pines entradas digitales
const int LSL_PIN = 39;
const int LSH_PIN = 36;

// Pines bombas (L293D)
const int EN[4]  = {19, 4, 26, 13};
const int IN1[4] = {18, 17, 25, 14};
const int IN2[4] = {5, 16, 33, 27};

// Sensor TDS en GPIO34
const int TDS_PIN = 34;
// Sensor pH HW-828
const int PH_PIN = 35;
const int TEMP_PIN = 32;

// Luminosidad
const int PWM_LIGHT_PIN = 23;

// Bomba de aire
const int AIR_PUMP_PIN = 3;


// Direcciones Modbus
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

ModbusIP mb;

// === PID ===
double lux, pwmLight, setpoint;
PID LUX_PID(&lux, &pwmLight, &setpoint, 0.1, 0.5, 0, DIRECT);

// === TIMERS ===
unsigned long t_now, t_last_air = 0, t_last_bomba[3] = {0, 0, 0};
bool air_state = false, bomba_state[3] = {false, false, false};

void setup() {
  Serial.begin(115200);

  WiFi.begin("REHF-2.4G", "tontosYtorpes291");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado. IP: ");
  Serial.println(WiFi.localIP());

  while (!Serial) { delay(10); }
  Serial.println("Adafruit VEML7700 Test");

  if (!veml.begin()) {
    Serial.println("Sensor not found");
    while (1);
  }
  Serial.println("Sensor found");

  veml.setLowThreshold(10000);
  veml.setHighThreshold(20000);
  veml.interruptEnable(true);

  LUX_PID.SetOutputLimits(0, 255);
  LUX_PID.SetMode(AUTOMATIC);

  mb.server();

  // Configurar pines
  for (int i = 0; i < 4; i++) {
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
  mb.addHreg(HREG_MODE, 0);
  mb.addHreg(HREG_LUX_SP, 100);
  mb.addHreg(HREG_AIR_ON_TIME, 180);
  mb.addHreg(HREG_AIR_OFF_TIME, 3420);

  for (int i = 0; i < 3; i++) {
    mb.addHreg(HREG_B1_SP + i * 3, 500);
    mb.addHreg(HREG_B1_ON_TIME + i * 3, 10);
    mb.addHreg(HREG_B1_OFF_TIME + i * 3, 300);
  }

  mb.addIreg(IREG_TDS_RAW, 0);
  mb.addIreg(IREG_PH_RAW, 0);
  mb.addIreg(IREG_TEMP_RAW, 0);
  mb.addIreg(IREG_LIGHT_LUX, 0);
  mb.addIreg(IREG_LSL, 0);
  mb.addIreg(IREG_LSH, 0);
}

void loop() {
  mb.task();
  t_now = millis();

  // Lecturas sensores analógicos
  rawTDS = analogRead(TDS_PIN);
  rawPH = analogRead(PH_PIN);
  rawTEMP = analogRead(TEMP_PIN);
  lux = veml.readLux();

  mb.Ireg(IREG_TDS_RAW, rawTDS);
  mb.Ireg(IREG_PH_RAW, rawPH);
  mb.Ireg(IREG_TEMP_RAW, rawTEMP);
  mb.Ireg(IREG_LIGHT_LUX, (int)lux);

    // Entradas digitales
  bool LSL = digitalRead(LSL_PIN);
  bool LSH = digitalRead(LSH_PIN);

  mb.Ireg(IREG_LSL, LSL);
  mb.Ireg(IREG_LSH, LSH);

  Serial.print("tds: "); Serial.println(rawTDS);
  Serial.print("temp: "); Serial.println(rawTEMP);
  Serial.print("pH: "); Serial.println(rawPH);
  Serial.print("lux: "); Serial.println(lux);

  int mode = mb.Hreg(HREG_MODE);

  if ((mode == 1) && (LSL==0)) {
    controlAutomatico(rawTDS, rawPH);
  }
  else {
    controlManual();
  }
}

void controlManual() {
  // Bombas velocidad variable
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
    // PWM luminosidad
  int pwmLight = constrain(mb.Hreg(HREG_LIGHT_PWM), 0, 255);
  analogWrite(PWM_LIGHT_PIN, pwmLight);
}

void controlAutomatico(int tds, int ph) {
  setpoint = mb.Hreg(HREG_LUX_SP);
  LUX_PID.Compute();
  analogWrite(PWM_LIGHT_PIN, (int)pwmLight);
  // Bomba de aire
  int ton = mb.Hreg(HREG_AIR_ON_TIME) * 1000;
  int toff = mb.Hreg(HREG_AIR_OFF_TIME) * 1000;
  if (air_state && (t_now - t_last_air >= ton)) {
    air_state = false; t_last_air = t_now;
  } else if (!air_state && (t_now - t_last_air >= toff)) {
    air_state = true; t_last_air = t_now;
  }
  digitalWrite(AIR_PUMP_PIN, air_state);

    // Bombas 1 a 3 automáticas
  for (int i = 0; i < 3; i++) {
    int sp = mb.Hreg(HREG_B1_SP + i * 3);
    int b_on = mb.Hreg(HREG_B1_ON_TIME + i * 3) * 1000;
    int b_off = mb.Hreg(HREG_B1_OFF_TIME + i * 3) * 1000;
    bool cond = (i < 2) ? (tds < sp) : (ph < sp);

    if (bomba_state[i] && (t_now - t_last_bomba[i] >= b_on)) {
      bomba_state[i] = false; t_last_bomba[i] = t_now;
    } else if (!bomba_state[i] && cond && (t_now - t_last_bomba[i] >= b_off)) {
      bomba_state[i] = true; t_last_bomba[i] = t_now;
    }

    int pwm = bomba_state[i] ? 255 : 0;
    analogWrite(EN[i], pwm);
    digitalWrite(IN1[i], bomba_state[i]);
    digitalWrite(IN2[i], LOW);
  }

}

