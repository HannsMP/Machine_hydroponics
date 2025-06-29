from machine import Pin, PWM, ADC
import time

def map(val, a1, a2, b1, b2):
    return b1 + ((val - a1) / a2) * b2

# Configuración de pines
servo_pin = 5  # Cambia esto al pin correcto
pot_pin = 34  # Cambia esto al pin correcto

# Configuración del PWM para el servo
frecuencia_pwm = 50  # Frecuencia en Hz para un servo
servo_pwm = PWM(Pin(servo_pin))
servo_pwm.freq(frecuencia_pwm)

# Inicializar ADC en el pin del potenciómetro
pot = ADC(Pin(pot_pin))
pot.atten(ADC.ATTN_11DB)  # Configurar el rango de voltaje del ADC

def leer_pot():
    valor_pot = pot.read()  # Leer el valor del potenciómetro (0-4095)
    return valor_pot

def main():
    while True:
        valor_pot = leer_pot()
        if valor_pot < 2048:
            # Girar en una dirección (por debajo del 50%)
            duty = int((valor_pot / 2048) * 25 + 50)  # Mapea el valor a un rango de 5% a 7.5%
        elif valor_pot > 2048:
            # Girar en la otra dirección (por encima del 50%)
            duty = int((valor_pot - 2048) / 2048 * 25 + 75)  # Mapea el valor a un rango de 7.5% a 10%
        else:
            # Detener el servo (exactamente en 50%)
            duty = 75  # 7.5% de ciclo de trabajo

        servo_pwm.duty(duty)
        print(f'Ciclo de trabajo del servo: {duty} - {valor_pot}')
        time.sleep(0.1)  # Pausa para estabilizar la lectura

if __name__ == '__main__':
    main()