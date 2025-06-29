import network
import socket

# Configurar la ESP32 como Access Point
ssid = 'ESP32_AP'
password = 'micropython123'

ap = network.WLAN(network.AP_IF)
ap.active(True)
ap.config(essid=ssid, password=password)

# Esperar hasta que el AP esté activo
while not ap.active():
    pass

print('Red AP activa')
print('Config:', ap.ifconfig())

# Crear el servidor web
addr = socket.getaddrinfo('0.0.0.0', 80)[0][-1]
server_socket = socket.socket()
server_socket.bind(addr)
server_socket.listen(1)
print('Escuchando en', addr)

# Función para manejar solicitudes GET y POST
def handle_client(client_socket):
    request = client_socket.recv(1024)
    request = request.decode('utf-8')
    print('Solicitud:')
    print(request)

    if 'GET' in request:
        response = """HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n
                      <html>
                      <body>
                      <h1>Hola desde la ESP32 - GET Request</h1>
                      </body>
                      </html>"""
    elif 'POST' in request:
        response = """HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n
                      <html>
                      <body>
                      <h1>Hola desde la ESP32 - POST Request</h1>
                      </body>
                      </html>"""
    else:
        response = "HTTP/1.1 400 Bad Request\r\n\r\n"

    client_socket.send(response)
    client_socket.close()

# Servidor en bucle
while True:
    client_socket, client_addr = server_socket.accept()
    print('Cliente conectado desde', client_addr)
    handle_client(client_socket)
