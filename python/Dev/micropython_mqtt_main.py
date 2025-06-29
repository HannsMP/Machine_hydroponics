from umqtt.simple import MQTTClient
import ubinascii
from machine import unique_id, Pin, reset
from time import sleep

#VARIABLES GENERALES MQTT:
client_id = ubinascii.hexlify(unique_id())
mqtt_server = '192.168.1.21'

#LED SETUP
led = Pin(2, Pin.OUT)
led_topic = b'devpe/led'

#BOTON SETUP
btn = Pin(5, Pin.IN, Pin.PULL_UP)
btn_topic = b'devpe/boton'

#MQTT CALLBACK
def led_callback(topic, msg):
    if msg.decode() == 'on':
        led.value(1)
    elif msg.decode() == 'off':
        led.value(0)
    print(f"Mensaje recibido: {msg.decode()}")

#MQTT SETUP Y SUBSCRIPCION
def cliente_mqtt():
    mqttc = MQTTClient(client_id, mqtt_server, keepalive=60)
    mqttc.set_callback(led_callback)
    mqttc.connect()
    mqttc.subscribe(led_topic)
    print(f'Conexion MQTT establecida con el servidor {mqtt_server}')
    return mqttc

#MQTT RECONEXION
def reinicia_mqtt():
    print('Fallo de conexion ... reestableciendo')
    sleep(10)
    reset()

#CREACION DEL CLIENTE Y SUBSCRIPCION 
try:
    cliente = cliente_mqtt()
except OSError as e:
    reinicia_mqtt()

#CICLO DE PUBLICACION
while True:
    try:
        if cliente.check_msg() != 'None':
            if btn.value() == 0:
                mensaje = 'ESP32 DevPE'
                cliente.publish(btn_topic, mensaje.encode())
                print(f'Mensaje enviado a broker {mqtt_server}')
        sleep(0.5)
    except OSError as e:
        reinicia_mqtt()