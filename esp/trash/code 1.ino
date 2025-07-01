#ifdef ESP8266
  #include <ESP8266WiFi.h>
#else // ESP32
  #include <WiFi.h>
#endif
#include <ModbusIP_ESP8266.h>
#include "Adafruit_VEML7700.h"

Adafruit_VEML7700 veml = Adafruit_VEML7700();

float lux;
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
const int COIL_AIR_PUMP = 0;
const int HREG_LIGHT_PWM = 0;
const int COIL_BOMBA_BASE = 1;       // Coils 1-4: encendido bombas 1-4
const int HREG_BOMBA_BASE = 1;       // Hregs 0-3: velocidad bombas 1-4

const int IREG_TDS_RAW = 0;
const int IREG_PH_RAW = 1;
const int IREG_TEMP_RAW = 2;
const int IREG_LIGHT_LUX = 3;
const int IREG_LSL = 4;
const int IREG_LSH = 5;

ModbusIP mb;

void setup() {
  Serial.begin(115200);

  WiFi.begin("TRINIDAD 2.4G", "TriAnd.7284");
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
  mb.addIreg(IREG_TDS_RAW, 0);
  mb.addIreg(IREG_PH_RAW, 0);
  mb.addIreg(IREG_TEMP_RAW, 0);
  mb.addIreg(IREG_LIGHT_LUX, 0);
  mb.addIreg(IREG_LSL, 0);
  mb.addIreg(IREG_LSH, 0);
}

void loop() {
  mb.task();

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

    // Bomba de aire
  digitalWrite(AIR_PUMP_PIN, mb.Coil(COIL_AIR_PUMP));

  // Lectura del TDS (ADC de 0–4095)
  int rawTDS = analogRead(TDS_PIN);
  
  // Conversión simple a ppm (puedes ajustar según tu calibración)
  // Ejemplo: suposición lineal — 3.3V = 4095 -> ~1000ppm
  float voltage = rawTDS * (3.3 / 4095.0);
  int ppm = voltage * 500;  // escala estimada, ajústala según tu sensor

  // Lecturas sensores analógicos
  rawTDS = analogRead(TDS_PIN);
  rawPH = analogRead(PH_PIN);
  rawTEMP = analogRead(TEMP_PIN);
  lux = veml.readLux();

  mb.Ireg(IREG_TDS_RAW, rawTDS);
  mb.Ireg(IREG_PH_RAW, rawPH);
  mb.Ireg(IREG_TEMP_RAW, rawTEMP);
  mb.Ireg(IREG_LIGHT_LUX, (int)lux);

    // PWM luminosidad
  int pwmLight = constrain(mb.Hreg(HREG_LIGHT_PWM), 0, 255);
  analogWrite(PWM_LIGHT_PIN, pwmLight);

  // Entradas digitales
  mb.Ireg(IREG_LSL, digitalRead(LSL_PIN));
  mb.Ireg(IREG_LSH, digitalRead(LSH_PIN));

  Serial.print("tds: "); Serial.println(rawTDS);
  Serial.print("temp: "); Serial.println(rawTEMP);
  Serial.print("pH: "); Serial.println(rawPH);
  Serial.print("lux: "); Serial.println(lux);

  delay(500);  // Cada 500ms
}
