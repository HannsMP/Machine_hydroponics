from machine import Pin, PWM, ADC
import time

# Configuración de pines
servo_pin = 5  # Cambia esto al pin correcto

# Configuración del PWM para el servo
frecuencia_pwm = 50  # Frecuencia en Hz para un servo
servo_pwm = PWM(Pin(servo_pin))
servo_pwm.freq(frecuencia_pwm)


def main():
    while True:
        ciclo_trabajo = 56 #(26-128)
        servo_pwm.duty(ciclo_trabajo)  # Establecer el ciclo de trabajo del PWM
        angulo = (ciclo_trabajo - 26) * 180 // 102  # Calcular el ángulo aproximado del servo
        print(f'Ángulo del servo: {angulo}°')
        time.sleep(0.1)  # Pausa para estabilizar la lectura

if __name__ == '__main__':
    main()
