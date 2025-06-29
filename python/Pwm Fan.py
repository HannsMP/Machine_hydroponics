from machine import Pin, PWM, ADC
import time

# Configuración de pines
ventilador_pin = 2  # Cambia esto al pin correcto
pot_pin = 34  # Cambia esto al pin correcto

# Configuración del PWM
frecuencia_pwm = 25000  # Frecuencia en Hz
resolucion_pwm = 10  # Resolución del PWM en bits (0-1023)

# Inicializar PWM en el pin del ventilador
ventilador_pwm = PWM(Pin(ventilador_pin))
ventilador_pwm.freq(frecuencia_pwm)

# Inicializar ADC en el pin del potenciómetro
pot = ADC(Pin(pot_pin))
pot.atten(ADC.ATTN_11DB)  # Configurar el rango de voltaje del ADC

def leer_pot():
    valor_pot = pot.read()  # Leer el valor del potenciómetro (0-4095)
    ciclo_trabajo = valor_pot // 4  # Mapear el valor a un rango de 0-1023
    return ciclo_trabajo

def main():
    while True:
        ciclo_trabajo = leer_pot()
        ventilador_pwm.duty(ciclo_trabajo)  # Establecer el ciclo de trabajo del PWM
        porcentaje_velocidad = ciclo_trabajo * 100 // 1023  # Calcular el porcentaje de velocidad
        print(f'Porcentaje de velocidad: {porcentaje_velocidad}%')
        time.sleep(0.5)  # Pausa para estabilizar la lectura

if __name__ == '__main__':
    main()