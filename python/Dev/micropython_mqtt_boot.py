from machine import Pin
import time

def led_conexion(led):
  for i in range(6):
    led.on()
    time.sleep(0.1)
    led.off()
    time.sleep(0.1)

def connect():
    import network
    led_wifi = Pin(2, Pin.OUT)
    wifi_lan = network.WLAN(network.STA_IF)
    if not wifi_lan.isconnected():
        wifi_lan.active(True)
        wifi_lan.connect('MOVISTAR_8D46', '10e66R15t46')
        while not wifi_lan.isconnected():
            pass
    led_conexion(led_wifi)
    print(f"Conexion WIFI establecida con {wifi_lan.ifconfig()}")

connect()