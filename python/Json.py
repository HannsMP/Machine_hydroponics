import ujson

# Datos que queremos guardar en JSON
datos = {
    "ssid": "ESP32_AP",
    "password": "micropython123",
    "status": "active"
}

# Guardar datos en un archivo JSON
with open("config.json", "w") as archivo:
    ujson.dump(datos, archivo)

print("Datos guardados en config.json")

# Cargar datos desde un archivo JSON
with open("config.json", "r") as archivo:
    datos = ujson.load(archivo)

print("Datos cargados desde config.json")
print(datos)