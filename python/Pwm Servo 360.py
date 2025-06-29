from machine import Pin, PWM, ADC
import time

# Configuración de pines
servo_pin = 4  # Cambia esto al pin correcto

# Configuración del PWM para el servo
frecuencia_pwm = 50  # Frecuencia en Hz para un servo
servo_pwm = PWM(Pin(servo_pin))
servo_pwm.freq(frecuencia_pwm)

def main():
    while True:
        valor_pot = 100 # Leer el valor del potenciómetro (0-4095)
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
        print(f'Ciclo de trabajo del servo: {duty}')
        time.sleep(0.1)  # Pausa para estabilizar la lectura

if __name__ == '__main__':
    main()

