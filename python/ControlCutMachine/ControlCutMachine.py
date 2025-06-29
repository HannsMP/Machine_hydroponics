# --------------------------------------------------
# ------------------- Librerias -------------------
# --------------------------------------------------

import network 
import socket
import ujson
from os import stat
from time import sleep
from machine import Pin, I2C, PWM
import ssd1306
from microWebSrv import MicroWebSrv
from servos import Servo180, Servo360

# --------------------------------------------------
# --------------------- Pines ---------------------
# --------------------------------------------------

PIN_LED_LOCAL = 2
PIN_DISPLAY_SCL = 22
PIN_DISPLAY_SDA = 21
PIN_SERVO_CORTE = 4
PIN_SERVO_RODILLO = 12

# --------------------------------------------------
# ------------------- Instancias -------------------
# --------------------------------------------------

LedLocal = Pin(PIN_LED_LOCAL, Pin.OUT)
DisplayI2c = I2C(
    scl=Pin(PIN_DISPLAY_SCL), 
    sda=Pin(PIN_DISPLAY_SDA)
)
ServoCorte = Servo180(PIN_SERVO_CORTE)
ServoRodillo = Servo360(PIN_SERVO_RODILLO)

# --------------------------------------------------
# --------------------- Config ---------------------
# --------------------------------------------------

class Config:
    def __init__(self) -> None:
        self._default_()
        if not self.exists():
            return self.write()
        try:
            self.data = self.read()
        except Exception:
            self.write()
        
    def _default_(self):
        self.dirJson = "config.json"
        self.data = {
            "wifi": {
                # modo
                "Mode": "STA",
                # acces point
                "AP": {
                    "SSID": "ESP32-ControlMachine",
                    "PASSWORD":"adminlocal"
                },
                # static mode
                "STA": {
                    "SSID": "REHF-2.4G",
                    "PASSWORD":"tontosYtorpes291"
                },
                "IP": "",
                "SUBRED" : "255.255.255.0",
                "GATELINK": "",
                "DNS": "8.8.8.8"
            },
            "server": {
                "PORT": 3000
            },
            "process": {
                "STATE": 0, # -2 stop, -1 pause, 0 noInit, 1 play
                "CUTS": 0, # unidades
                "LENGTH": 0.0, # cm
                "CUTSFACTS": 0, # unidades
                "TEMPERATURE": 0 # temperatura
            }
        }

    def exists(self):
        try:
            stat(self.dirJson)
            return True
        except OSError:
            return False
        
        
    def read(self):
        with open(self.dirJson, "r") as file:
            return ujson.load(file)

    def write(self):
        with open(self.dirJson, "w") as archivo:
            ujson.dump(self.data, archivo)

# --------------------------------------------------
# -------------------- Display --------------------
# --------------------------------------------------

class Display:
    def __init__(self, config: Config):
        self.config = config
        self.oled = ssd1306.SSD1306_I2C(128, 64, DisplayI2c)
        
        self.Tittle = "  Cut  Machine  "
        self.Wifi = ""
        self.Server = ""
        self.Temperature = ""
        self.Process = ""
        self.Percentage = False
        
    def center (self, word):
        lenAll = 16
        lenWord = len(word)
        if(lenAll <= lenWord):
            return word[0: 15]
        dis = " " * ((lenAll - lenWord)//2)
        return f"{dis}{word}"
        
    def draw(self):
        self.oled.fill(0)
        self.oled.text(f"{self.Tittle}", 0, 0)
        self.oled.text(f"{self.Wifi}", 0, 9)
        self.oled.text(f"{self.Server}", 0, 18)
        self.oled.text(f"{self.Temperature}", 0, 27)
        
        self.oled.text(
            self.center(f" {self.Percentage or "-"}% {self.Process}"),
            0, 
            45
        )
        
        if self.Percentage != "":
            perc = (self.Percentage * 128) // 100
            for i in range(0, 128):
                if i > perc:
                    break
                    
                for j in range(60, 64):
                    self.oled.pixel(i, j, 1)
        
        self.oled.show()
        
# --------------------------------------------------
# --------------------- WiFi -----------------------
# --------------------------------------------------

class Wifi:
    
    def __init__(self, config: Config):
        self.config = config
        self.ap = network.WLAN(network.AP_IF)
        self.sta = network.WLAN(network.STA_IF)
        
    def _default_(self):
        self.config.data["wifi"]["AP"]["SSID"] = 'ESP32-ControlMachine'
        self.config.data["wifi"]["AP"]["PASSWORD"] = 'adminlocal'
        self.config.data["wifi"]["STA"]["SSID"] = ""
        self.config.data["wifi"]["STA"]["PASSWORD"] = ""
        self.config.write()
    
    def ap_on(self):
        self.ap.active(True)
        self.ap.config(
            essid=self.config.data["wifi"]["AP"]["SSID"],
            password=self.config.data["wifi"]["AP"]["PASSWORD"],
            authmode=3
        )

        while not self.ap.active():
            sleep(0.5)
            LedLocal.value(1)
            sleep(0.5)
            LedLocal.value(0)

        LedLocal.value(1)
        
        wifi = self.ap.ifconfig()
        
        self.config.data["wifi"]["IP"] = wifi[0]
        self.config.data["wifi"]["GATELINK"] = wifi[2]
        self.config.write()
        
    def ap_off(self):
        self.ap.active(False)
        LedLocal.value(0)
    
    def sta_connect(self, awaiting=10):
        self.sta.active(True)
        self.sta.connect(
            self.config.data["wifi"]["STA"]["SSID"], 
            self.config.data["wifi"]["STA"]["PASSWORD"]
        )

        denied = 0

        while not self.sta.isconnected():
            sleep(0.5)
            LedLocal.value(1)
            sleep(0.5)
            LedLocal.value(0)
            denied += 1
            
            if denied == awaiting:
                return False

        LedLocal.value(1)
        
        wifi = self.sta.ifconfig()
        
        self.config.data["wifi"]["IP"] = wifi[0]
        self.config.data["wifi"]["GATELINK"] = wifi[2]
        self.config.write()
        return True
        
    def sta_disconnect(self):
        self.sta.active(False)
        LedLocal.value(0)
    
    def ap_reset(self):
        self.ap_off()
        self.ap_on()

    def sta_scan_networks(self):
        self.sta.active(True)
        networks = self.sta.scan()
        self.sta.active(False)
        
        result = {}
        for network in networks:
            result[network[0].decode('utf-8')] = {
                "BSSID": ':'.join('%02x' % b for b in network[1]),
                "Channel": network[2],
                "RSSI": network[3],
                "Authmode": network[4],
                "Hidden": network[5]
            }
        return result
    
    def existNetwork(self, ssid):
        networks = self.sta_scan_networks()
        return ssid in networks

# --------------------------------------------------
# ---------------------- App ----------------------
# --------------------------------------------------

class App:
    def __init__(self):
        self.cnfg = Config()
        self.display = Display(self.cnfg)
        self.wifi = Wifi(self.cnfg)
        
        # -------------------------
        # ----- Connect Wifi ------
        
        self.connect()
            
        # -------------------------
        # ----- Charge Route ------
        
        self.routes()
        
        # -------------------------
        # ----- Listen Port ------
        
        self.listen()

        # -------------------------
        # ----- Start Motors ------

        self.process()

    def process (self):
        
        def processRodillo ():
            pass
        
        def processCorte():
            pass

        while True:
            while self.cnfg.data["process"]["STATE"] == 1:
                # -------- solo editen aqui
                processRodillo()
                    # eviten usar delays solo variables de estado
                    # para tener un control en tiempo real
                processCorte()
                # -------- hasta aqui
                self.display.Percentage = (self.cnfg.data["process"]["CUTSFACTS"]*100)// self.cnfg.data["process"]["CUTS"]
                self.display.Process = "Init"
                self.display.draw()

                if self.cnfg.data["process"]["CUTS"] <= self.cnfg.data["process"]["CUTSFACTS"]:
                    self.cnfg.data["process"]["STATE"] = -2
                    self.cnfg.write()
                    # no hay braek por que ya el estado del proceso no es 1

            if self.cnfg.data["process"]["STATE"] == 0:
                self.display.Percentage = ""
                self.display.Process = "noInit"

            if self.cnfg.data["process"]["STATE"] == -1:
                self.display.Process = "Pause"

            if self.cnfg.data["process"]["STATE"] == -2:
                self.display.Process = "Stop"

            self.display.draw()
            sleep(1)
        
    def connect(self, msg = "Iniciando Wifi"):
        self.display.Wifi = self.display.center(msg)
        self.display.draw()
        
        if self.cnfg.data["wifi"]["Mode"] == "STA":
            existNetwork = self.wifi.existNetwork(self.cnfg.data["wifi"]["STA"]["SSID"])
            
            if existNetwork:
                connected = self.wifi.sta_connect()
                
                if connected:
                    self.display.Wifi = self.display.center(self.cnfg.data["wifi"]["IP"])
                    self.display.draw()
                    return True

            self.cnfg.data["wifi"]["Mode"] = "AP"
            self.cnfg.write()
            self.connect("Regresando AP")
            return False
            
        else:
            self.wifi.ap_on()
            
            self.display.Wifi = self.display.center(self.cnfg.data["wifi"]["IP"])
            self.display.draw()
            return True
        
        
    def routes(self):
        
        @MicroWebSrv.route('/')
        def index_route(req, res):
            print('/', '')
            with open('views/index.html', 'r') as f:
                html = f.read()

            res.WriteResponseOk(
                headers=None, 
                contentType='text/html', 
                contentCharset='UTF-8', 
                content=html
            )
            
        @MicroWebSrv.route('/read', 'POST')
        def read_route(req, res):
            res.WriteResponseJSONOk(obj={
                "estado": self.cnfg.data["process"]["STATE"],
                "cortes": self.cnfg.data["process"]["CUTS"],
                "longitud": self.cnfg.data["process"]["LENGTH"],
                "cortesHechos": self.cnfg.data["process"]["CUTSFACTS"],
                "temperatura": self.cnfg.data["process"]["TEMPERATURE"]
            })

        @MicroWebSrv.route('/play', 'POST')
        def play_route(req, res):
            data = req.ReadRequestContentAsJSON()
            self.cnfg.data["process"]["STATE"] = 1
            self.cnfg.data["process"]["CUTS"] = int(data.get('cortes', 0))
            self.cnfg.data["process"]["LENGTH"] = float(data.get('longitud', 0))
            self.cnfg.data["process"]["TEMPERATURE"] = float(data.get('temperatura', 0))
            self.cnfg.write()
            res.WriteResponseJSONOk(obj={'confirm': True})

        @MicroWebSrv.route('/pause', 'POST')
        def pause_route(req, res):
            self.cnfg.data["process"]["STATE"] = -1
            self.cnfg.write()
            res.WriteResponseJSONOk(obj={'confirm': True})

        @MicroWebSrv.route('/stop', 'POST')
        def stop_route(req, res):
            self.cnfg.data["process"]["STATE"] = -2
            self.cnfg.write()
            res.WriteResponseJSONOk(obj={'confirm': True})

        @MicroWebSrv.route('/reset', 'POST')
        def reset_route(req, res):
            self.cnfg.data["process"]["STATE"] = 0
            self.cnfg.data["process"]["CUTS"] = 0
            self.cnfg.data["process"]["CUTSFACTS"] = 0
            self.cnfg.data["process"]["LENGTH"] = 0.0
            self.cnfg.data["process"]["TEMPERATURE"] = 0
            self.cnfg.write()
            res.WriteResponseJSONOk(obj={'confirm': True})

        @MicroWebSrv.route('/readWifi', 'POST')
        def readWifi_route(req, res):
            res.WriteResponseJSONOk(obj={
                "Mode": self.cnfg.data["wifi"]["Mode"],
                "AP":{
                    "SSID": self.cnfg.data["wifi"]["AP"]["SSID"],
                    "PASSWORD": self.cnfg.data["wifi"]["AP"]["PASSWORD"]
                },
                "STA":{
                    "SSID": self.cnfg.data["wifi"]["STA"]["SSID"],
                    "PASSWORD": self.cnfg.data["wifi"]["STA"]["PASSWORD"]
                }
            })

        @MicroWebSrv.route('/setSta', 'POST')
        def setSta_route(req, res):
            data = req.ReadRequestContentAsJSON()
            ssid = data.get('SSID', "")

            existNetwork = self.wifi.existNetwork(ssid)
            
            if not existNetwork:
                return res.WriteResponseJSONOk(obj={'confirm': False})

            self.cnfg.data["wifi"]["STA"]["Mode"] = "STA"
            self.cnfg.data["wifi"]["STA"]["SSID"] = ssid
            self.cnfg.data["wifi"]["STA"]["PASSWORD"] = data.get('PASSWORD', "")
            self.cnfg.write()
            
            res.WriteResponseJSONOk(obj={'confirm': True})

            self.wifi.ap_off()
            
            self.display.Wifi = self.display.center("STA")
            self.display.Server = self.display.center("Cargando...")
            self.display.draw()
            
            connected = self.wifi.sta_connect()
            
            if not connected:
                self.display.Wifi = self.display.center("STA")
                self.display.Server = self.display.center(
                    "Access denied"
                )
                self.display.draw()
                
                self.wifi.ap_on()
                
                self.cnfg.data["wifi"]["STA"]["Mode"] = "AP"
                self.cnfg.write()

            
            self.display.Wifi = self.display.center(self.cnfg.data["wifi"]["IP"])
            self.display.Server = self.display.center(
                    f"{self.cnfg.data["wifi"]["Mode"]} | {self.cnfg.data["server"]["PORT"]}"
                )
            self.display.draw()
            
            

        @MicroWebSrv.route('/setAp', 'POST')
        def setAp_route(req, res):
            data = req.ReadRequestContentAsJSON()
            self.cnfg.data["wifi"]["AP"]["Mode"] = "AP"
            self.cnfg.data["wifi"]["AP"]["SSID"] = data.get('SSID', "")
            self.cnfg.data["wifi"]["AP"]["PASSWORD"] = data.get('PASSWORD', "")
            self.cnfg.write()

            res.WriteResponseJSONOk(obj={'confirm': True})

            self.wifi.sta_disconnect()
            
            self.wifi.ap_on()
            
            self.display.Wifi = self.display.center(self.cnfg.data["wifi"]["IP"])
            self.display.Server = self.display.center(
                    f"{self.cnfg.data["wifi"]["Mode"]} | {self.cnfg.data["server"]["PORT"]}"
                )
            self.display.draw()

    def listen(self):
        self.srv = MicroWebSrv(webPath='/www', port = self.cnfg.data["server"]["PORT"])
        self.srv.Start(threaded=True)
        
        self.display.Server = self.display.center(
            f"{self.cnfg.data["wifi"]["Mode"]} | {self.cnfg.data["server"]["PORT"]}"
        )
        self.display.draw()
# --------------------------------------------------
# ---------------------- Run ----------------------
# --------------------------------------------------

if __name__ == "__main__":
    App()
    