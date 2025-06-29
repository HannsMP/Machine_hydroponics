#include <WiFi.h>
#include <PubSubClient.h>

WiFiClient espClient;
PubSubClient client(espClient);
char msg[10];

void setup() {
  setup_wifi();
  client.setServer("192.168.1.21", 1883); //Conexion a servidor por puerto 1883 de mosquitto
  client.setCallback(callback); //Funcion de conversion
  pinMode(2,OUTPUT);
}
  
void loop() {
  if(!client.connected()){
    reconnect();
    }
  client.loop(); //Funcion necesaria para que se mantenga conectado con el subscriptor
  int pot = analogRead(34); // Opcional pulsador para que envie solo cuando lo presionamos
  Serial.println(pot);
  snprintf(msg,10,"%d",pot); //conversion a string
  client.publish ("canal1", msg);
  delay(500);

}

// Funcion de conexion a WIFI
void setup_wifi(){
  Serial.begin(9600); // Activa puerto serial
  WiFi.begin("MOVISTAR_8D46", "10e66R15t46");// Conexion a modem
  while(WiFi.status()!= WL_CONNECTED ){ // Mientras este desconectado imprime lo siguiente.
    delay(300);
    Serial.print(".");
    }
  Serial.println(WiFi.localIP());// Imprime el IP del modem conectado
  }

// Funcion de reconexion de Wifi y subscripcion de cliente 
void reconnect(){
  if(client.connect("ESP_DevPE")){//Metodo para verificar conexion. El if acepta TRUE
    Serial.println("Conexion exitosa");}
    client.subscribe("canal2");//Metodo para subscribcion con topico de parametro
  }

// Funcion de recepcion de datos de subscritor
void callback(char* topic, byte* payload, unsigned int length){
  payload[length]= '\0'; // Elimina los demas parametros
  String dato = String((char*)payload); // Almacena el dato enviado por el subscriptor
  Serial.println(dato);
  if (dato == "a"){
    digitalWrite(2,HIGH);
    }
  if (dato == "b"){
    digitalWrite(2,LOW);
    }
  Serial.println(dato); 
  }
