#include <WiFi.h>

// Configuración del Access Point
const char* ssid = "ESP32_AP";
const char* password = "12345678";

void setup() {
  Serial.begin(115200);

  // Inicializa el modo Access Point
  WiFi.softAP(ssid, password);

  IPAddress IP = WiFi.softAPIP();
  Serial.print("Access Point IP address: ");
  Serial.println(IP);
}

void loop() {
  // Aquí podrías manejar clientes o simplemente mantener el AP activo
}