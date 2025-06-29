import network
import time
from microWebSrv import MicroWebSrv

# Configuración del Wi-Fi
def connect_to_wifi(ssid, password):
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print('Conectando a la red...', ssid)
        wlan.connect(ssid, password)
        while not wlan.isconnected():
            time.sleep(1)
            print('.')
    print('Conexión establecida:', wlan.ifconfig())
    return wlan

# Ruta inicial que responderá con un HTML que dice "Hola Mundo"
@MicroWebSrv.route('/')
def index(httpClient, httpResponse):
    content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Hola Mundo</title>
        <style>
            body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                font-family: Arial, sans-serif;
                background-color: #f0f0f0;
            }
            .container {
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Hola Mundo</h1>
        </div>
    </body>
    </html>
    """
    httpResponse.WriteResponseOk(
        headers = None,
        contentType = "text/html",
        contentCharset = "UTF-8",
        content = content
    )

# Ruta POST /read que responderá con JSON {confirm: true}
@MicroWebSrv.route('/read', 'POST')
def read(httpClient, httpResponse):
    content = {"confirm": True}
    httpResponse.WriteResponseJSONOk(obj=content)

# Función principal
def main():
    # Conectar al Wi-Fi
    ssid = "REHF-2.4G"
    password = "tontosYtorpes291"
    connect_to_wifi(ssid, password)

    # Iniciar el servidor web
    srv = MicroWebSrv(webPath='/www')
    srv.Start(threaded=True)
    print("Servidor corriendo en el puerto 80...")

if __name__ == '__main__':
    main()