import network
import time

ssid = 'REHF-2.4G'
password = 'tontosYtorpes291'

def conectar_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(ssid, password)

    while not wlan.isconnected():
        print('Conectando...')
        time.sleep(1)
    print('Conexión establecida!')
    gate = wlan.ifconfig()
    print(gate)

conectar_wifi()