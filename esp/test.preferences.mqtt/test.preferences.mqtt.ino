#include <WiFi.h>
#include <PubSubClient.h>
#include <PID_v1.h>
#include <ArduinoJson.h>
#include <Preferences.h>

Preferences preferences;

const int NUM_GROUP = 3;

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
// Pwm D_LUX_SP (0-65535)
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

  WiFi.begin("REHF-2.4G", "tontosYtorpes291");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.print("WiFi conectado. IP: ");
  Serial.println(WiFi.localIP());

  client.setServer("test.mosquitto.org", 1883);
  client.setCallback(callback);
  Serial.println("MQTT configurado.");

  LUX_PID.SetOutputLimits(0, 255);
  LUX_PID.SetMode(AUTOMATIC);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  CURRENT_TIME = millis();

  // Simulación de sensores en rangos típicos
  D_LUX = random(0, 1000);
  IREG_LUX = max((int)D_LUX, 0);
  IREG_TDS_RAW = random(200, 800);   // ejemplo ppm crudos
  IREG_PH_RAW = random(400, 600);    // ejemplo voltaje
  IREG_TEMP_RAW = random(200, 400);  // ejemplo 20-40°C *10
  IREG_LSL = random(0, 2);           // 0 o 1
  IREG_LSH = random(0, 2);

  if ((HREG_MODE == 1) && (IREG_LSL == 0))
    controlAutomatico();
  else
    controlManual();
}

void controlManual() {
  // lux
  STATUS_LUX = (HREG_LUX_PWM > 0) ? 1 : 0;

  // air
  STATUS_AIR = COIL_AIR_PUMP;

  // bumb
  for (int i = 0; i < NUM_GROUP; i++) {
    GROUP_STATUS_PUMP[i] = (GROUP_COIL_PUMP[i] && GROUP_HREG_PUMP[i]) ? 1 : 0;
  }
}

void controlAutomatico() {
  // lux
  D_LUX_SP = HREG_LUX_SP;
  LUX_PID.Compute();
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

  GROUP_ON_MS_PUMP[0] = preferences.getInt("HREG_ON_MS_PUMP_0", GROUP_ON_MS_PUMP[0]);
  GROUP_ON_MS_PUMP[1] = preferences.getInt("HREG_ON_MS_PUMP_1", GROUP_ON_MS_PUMP[1]);
  GROUP_ON_MS_PUMP[2] = preferences.getInt("HREG_ON_MS_PUMP_2", GROUP_ON_MS_PUMP[2]);

  GROUP_OFF_MS_PUMP[0] = preferences.getInt("HREG_OFF_MS_PUMP_0", GROUP_OFF_MS_PUMP[0]);
  GROUP_OFF_MS_PUMP[1] = preferences.getInt("HREG_OFF_MS_PUMP_1", GROUP_OFF_MS_PUMP[1]);
  GROUP_OFF_MS_PUMP[2] = preferences.getInt("HREG_OFF_MS_PUMP_2", GROUP_OFF_MS_PUMP[2]);
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

  client.publish("tUtdKieGNkTKInY7UIljxbCzWDS1g0G4kXh1x0VntQtSFeW5at", out);
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

  client.publish("epRRsLyNRTBLvfYtRwteY3nV5TGQZ9y8bqlvaIY27f3w6GARIy", out);
}

void callback(char* topic, byte* payload, unsigned int length) {
  payload[length] = '\0';
  String t = topic;
  String msg = String((char*)payload);
  int rawValue = msg.toInt();
  int value = max(rawValue, 0);

  Serial.println(t);
  Serial.print(value);

  if (t == "RClslUAhsQ1xwSAv1qcxGK3v9PQ0P2Fri1NdS7JScnDUHVZKN/REQ_DATA_STREAM") {
    send_data_stream();
  } else {

    if (t == "g7bY0q7Pugxr0PtntLUDKp03Qq0Ix9X7o9SC9dVvfNylC4Sx6o/HREG_MODE") {
      preferences.putInt("HREG_MODE", (HREG_MODE = value == 0 ? 0 : 1));
    } else if (t == "gEq9ls9ykPNNgldO4NL6BSrpQOinnjVFfPwVIpUxGOB72CBl5X/COIL_LUX") {
      preferences.putInt("COIL_LUX", (COIL_LUX = value == 0 ? 0 : 1));
    } else if (t == "PxtEkab5RJhU15AKksOROz8fLRZxNBu46BHSKZz3Jf7mDqMl2X/COIL_AIR_PUMP") {
      preferences.putInt("COIL_AIR_PUMP", (COIL_AIR_PUMP = value == 0 ? 0 : 1));
    }

    else if (t == "zbOYz0gdDXlIM7CRFhyFNi7tSHUt7RWLJ91hpftRubYiPBQ25H/HREG_LUX_PWM") {
      preferences.putInt("HREG_LUX_PWM", (HREG_LUX_PWM = min(value, 255)));
    } else if (t == "1fqLtnny9PrSwVMFIsNlZcsT7E3PByd4CADdWl4IiQYHSYywES/HREG_LUX_SP") {
      preferences.putInt("HREG_LUX_SP", (HREG_LUX_SP = min(value, 65535)));
    } else if (t == "m0oO8kYdByc6WfgMP88XicYMAarsLseLYjkZx9zGKX03yD9XH3/HREG_ON_MS_AIR") {
      preferences.putInt("HREG_ON_MS_AIR", (HREG_ON_MS_AIR = value));
    } else if (t == "SNSnLpYdddAUTCa7aptbS7jwrSmghpfWu0wA0LwTSeSw4E42GN/HREG_OFF_MS_AIR") {
      preferences.putInt("HREG_OFF_MS_AIR", (HREG_OFF_MS_AIR = value));
    }

    else if (t == "wri6FawZVgXplPYpD1ClB81oZEf5rI4VsfyL94GHXrqJpK30VD/COIL_PUMP_0") {
      preferences.putInt("COIL_PUMP_0", (GROUP_COIL_PUMP[0] = value == 0 ? 0 : 1));
    } else if (t == "xySHEExHfaewzvJakYs0PDjLk04PZFDt9YJHVkLeHU17V6Kg7g/COIL_PUMP_1") {
      preferences.putInt("COIL_PUMP_1", (GROUP_COIL_PUMP[1] = value == 0 ? 0 : 1));
    } else if (t == "y8dbxppKBvx69wgTuY1U6IehxDKNcTfydmXJcO4E2EHCPiA6Nh/COIL_PUMP_2") {
      preferences.putInt("COIL_PUMP_2", (GROUP_COIL_PUMP[2] = value == 0 ? 0 : 1));
    }

    else if (t == "hqj4ttb3eaigYsgLV2m7KaSQcfN5kJiU3PvqfITUAgu736Jhta/HREG_DOPING_SP_0") {
      preferences.putInt("HREG_DOPING_SP_0", (GROUP_HREG_DOPING_SP[0] = min(value, 4095)));
    } else if (t == "GkSakMYpEx3BQhcwgNegDiqvDbRuSsTKRKTmuExMudp7r4ovkq/HREG_DOPING_SP_1") {
      preferences.putInt("HREG_DOPING_SP_1", (GROUP_HREG_DOPING_SP[1] = min(value, 4095)));
    } else if (t == "rKxhJd0Lry1F8vWExBl7twDowo5EIauN1Ca24LrISb88hRcCCa/HREG_DOPING_SP_2") {
      preferences.putInt("HREG_DOPING_SP_2", (GROUP_HREG_DOPING_SP[2] = min(value, 4095)));
    }

    else if (t == "6Fbrbg5YFbFxmkT62VaD3KBoXSNm4WiB8iv7zoclatrWMI6XvS/HREG_PUMP_0") {
      preferences.putInt("HREG_PUMP_0", (GROUP_HREG_PUMP[0] = min(value, 255)));
    } else if (t == "XzP4mGanBHBEFzzf8dehGJ8ToZd6EkWp0EjBBDolhKTaIlnO9i/HREG_PUMP_1") {
      preferences.putInt("HREG_PUMP_1", (GROUP_HREG_PUMP[1] = min(value, 255)));
    } else if (t == "o3dtOkdJT3DyW2qPOPEVBzWZsEk2Iz7ZcXnq461iRUxu3v55aG/HREG_PUMP_2") {
      preferences.putInt("HREG_PUMP_2", (GROUP_HREG_PUMP[2] = min(value, 255)));
    }

    else if (t == "Hx1kYvn1aAQRx43dvX77WPi0Ad2Gx3Bg4GLMh6y2aBuCpxhbxL/HREG_ON_MS_PUMP_0") {
      preferences.putInt("HREG_ON_MS_PUMP_0", (GROUP_ON_MS_PUMP[0] = value * 1000));
    } else if (t == "pJZZDo0HsNFJtmEJtArx2mpVDYJgIOK5851KognKYei5jKUfRI/HREG_ON_MS_PUMP_1") {
      preferences.putInt("HREG_ON_MS_PUMP_1", (GROUP_ON_MS_PUMP[1] = value * 1000));
    } else if (t == "nMYHshmWkiGqWP46KNW5dKDlsCkC6nSzKAc4qEGRjEOKpRR28b/HREG_ON_MS_PUMP_2") {
      preferences.putInt("HREG_ON_MS_PUMP_2", (GROUP_ON_MS_PUMP[2] = value * 1000));
    }

    else if (t == "N2eK4eWasg5kyk9YdPWhas3gYWl7bBD8IWJen64bAWnvQAm9Mb/HREG_OFF_MS_PUMP_0") {
      preferences.putInt("HREG_OFF_MS_PUMP_0", (GROUP_OFF_MS_PUMP[0] = value * 1000));
    } else if (t == "dqWXqWpORX8M6boeFGIttmbiKWPRzBWB4jRIF2BjNUknB70Hjp/HREG_OFF_MS_PUMP_1") {
      preferences.putInt("HREG_OFF_MS_PUMP_1", (GROUP_OFF_MS_PUMP[1] = value * 1000));
    } else if (t == "clYgGkFHDGdvY2laGEKaEAIt9wOYeaAdBNkQaLLWuGS08qmMJ8/HREG_OFF_MS_PUMP_2") {
      preferences.putInt("HREG_OFF_MS_PUMP_2", (GROUP_OFF_MS_PUMP[2] = value * 1000));
    }

    send_data_config();
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.println("Conectando");
    if (!client.connect("LUaDMKOnvOL2MF43a2sf69DXvuQcq3JpVDxvoEPf14sOMruecN")) {
      delay(5000);
      continue;
      Serial.print(".");
    }

    Serial.println("Cliente Conectado");

    client.subscribe("RClslUAhsQ1xwSAv1qcxGK3v9PQ0P2Fri1NdS7JScnDUHVZKN/REQ_DATA_STREAM");
    client.subscribe("g7bY0q7Pugxr0PtntLUDKp03Qq0Ix9X7o9SC9dVvfNylC4Sx6o/HREG_MODE");
    client.subscribe("gEq9ls9ykPNNgldO4NL6BSrpQOinnjVFfPwVIpUxGOB72CBl5X/COIL_LUX");
    client.subscribe("PxtEkab5RJhU15AKksOROz8fLRZxNBu46BHSKZz3Jf7mDqMl2X/COIL_AIR_PUMP");
    client.subscribe("zbOYz0gdDXlIM7CRFhyFNi7tSHUt7RWLJ91hpftRubYiPBQ25H/HREG_LUX_PWM");
    client.subscribe("1fqLtnny9PrSwVMFIsNlZcsT7E3PByd4CADdWl4IiQYHSYywES/HREG_LUX_SP");
    client.subscribe("m0oO8kYdByc6WfgMP88XicYMAarsLseLYjkZx9zGKX03yD9XH3/HREG_ON_MS_AIR");
    client.subscribe("SNSnLpYdddAUTCa7aptbS7jwrSmghpfWu0wA0LwTSeSw4E42GN/HREG_OFF_MS_AIR");

    client.subscribe("wri6FawZVgXplPYpD1ClB81oZEf5rI4VsfyL94GHXrqJpK30VD/COIL_PUMP_0");
    client.subscribe("xySHEExHfaewzvJakYs0PDjLk04PZFDt9YJHVkLeHU17V6Kg7g/COIL_PUMP_1");
    client.subscribe("y8dbxppKBvx69wgTuY1U6IehxDKNcTfydmXJcO4E2EHCPiA6Nh/COIL_PUMP_2");

    client.subscribe("hqj4ttb3eaigYsgLV2m7KaSQcfN5kJiU3PvqfITUAgu736Jhta/HREG_DOPING_SP_0");
    client.subscribe("GkSakMYpEx3BQhcwgNegDiqvDbRuSsTKRKTmuExMudp7r4ovkq/HREG_DOPING_SP_1");
    client.subscribe("rKxhJd0Lry1F8vWExBl7twDowo5EIauN1Ca24LrISb88hRcCCa/HREG_DOPING_SP_2");

    client.subscribe("6Fbrbg5YFbFxmkT62VaD3KBoXSNm4WiB8iv7zoclatrWMI6XvS/HREG_PUMP_0");
    client.subscribe("XzP4mGanBHBEFzzf8dehGJ8ToZd6EkWp0EjBBDolhKTaIlnO9i/HREG_PUMP_1");
    client.subscribe("o3dtOkdJT3DyW2qPOPEVBzWZsEk2Iz7ZcXnq461iRUxu3v55aG/HREG_PUMP_2");

    client.subscribe("Hx1kYvn1aAQRx43dvX77WPi0Ad2Gx3Bg4GLMh6y2aBuCpxhbxL/HREG_ON_MS_PUMP_0");
    client.subscribe("pJZZDo0HsNFJtmEJtArx2mpVDYJgIOK5851KognKYei5jKUfRI/HREG_ON_MS_PUMP_1");
    client.subscribe("nMYHshmWkiGqWP46KNW5dKDlsCkC6nSzKAc4qEGRjEOKpRR28b/HREG_ON_MS_PUMP_2");

    client.subscribe("N2eK4eWasg5kyk9YdPWhas3gYWl7bBD8IWJen64bAWnvQAm9Mb/HREG_OFF_MS_PUMP_0");
    client.subscribe("dqWXqWpORX8M6boeFGIttmbiKWPRzBWB4jRIF2BjNUknB70Hjp/HREG_OFF_MS_PUMP_1");
    client.subscribe("clYgGkFHDGdvY2laGEKaEAIt9wOYeaAdBNkQaLLWuGS08qmMJ8/HREG_OFF_MS_PUMP_2");
  }
}