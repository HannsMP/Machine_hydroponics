from machine import Pin, I2C
import ssd1306
import time

# Configuración del bus I2C
i2c = I2C(scl=Pin(22), sda=Pin(21))

# Inicializar el display OLED
oled_width = 128
oled_height = 64
oled = ssd1306.SSD1306_I2C(oled_width, oled_height, i2c)

def mostrar_porcentaje(proporcion):
    # Limpiar el display
    oled.fill(0)
    # Mostrar "Hola mundo" en el display
    oled.text("  Cut  Machine  ", 0, 0)
    oled.text(" 192.168.200.64 ", 0, 9)
    oled.text("    port: 80    ", 0, 18)
    
    oled.text(f" {proporcion}% complete", 0, 45)

    # Mostrar el porcentaje en el display
    proporcion = (proporcion * 128) // 100
    for i in range(0, 128):
        if i > proporcion:
            break
            
        for j in range(60, 64):
            oled.pixel(i, j, 1)
    oled.show()

# Mostrar el 50% de grosor
for p in range(0, 101):
    
    mostrar_porcentaje(p)

    # Esperar unos segundos
    time.sleep(0.01)
