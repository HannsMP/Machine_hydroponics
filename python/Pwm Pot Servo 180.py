from machine import Pin, PWM, ADC
import time

# Configuración de pines
servo_pin = 4  # Cambia esto al pin correcto
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
    ciclo_trabajo = valor_pot * 102 // 4095 + 26  # Mapear el valor del potenciómetro al rango de ciclo de trabajo del servo (26-128)
    return ciclo_trabajo

def main():
    while True:
        ciclo_trabajo = leer_pot()
        servo_pwm.duty(ciclo_trabajo)  # Establecer el ciclo de trabajo del PWM
        angulo = (ciclo_trabajo - 26) * 180 // 102  # Calcular el ángulo aproximado del servo
        print(f'Ángulo del servo: {angulo}°')
        time.sleep(0.1)  # Pausa para estabilizar la lectura

if __name__ == '__main__':
    main()