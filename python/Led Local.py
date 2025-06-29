from machine import Pin
import time

# Configurar el pin del LED (generalmente GPIO 2)
led = Pin(2, Pin.OUT)

# Función para encender el LED
def led_on():
    led.value(1)

# Función para apagar el LED
def led_off():
    led.value(0)

# Bucle para encender y apagar el LED cada segundo
while True:
    led_on()
    print("LED encendido")
    time.sleep(1)
    led_off()
    print("LED apagado")
    time.sleep(1)
