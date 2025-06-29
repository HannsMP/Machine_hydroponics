from machine import Pin, PWM
from time import sleep, time

def map(value: int, a1: int, a2: int, b1: int, b2: int) -> int:
    return b1 + ((value - a1) * (b2 - b1)) // (a2 - a1)

class Servo180:
    def __init__(self, pin: int):
        self.servo = PWM(Pin(pin))
        self.servo.freq(50)
        self.angle = 0
        
    def setAngle(self, angle: int):
        if 0 <= angle <= 180:
            self.angle = angle
            duty = int(map(angle, 0, 180, 26, 128))
            self.servo.duty(duty)
            
    def smoothTransition(self, start: int, end: int, duracion: float):
        if start < 0 or start > 180 or end < 0 or end > 180:
            raise ValueError("El ángulo inicial y final deben estar entre 0 y 180 grados.")
        
        step = abs(end - start)
        if step == 0:
            return
        
        delay = duracion / step
        direccion = 1 if end > start else -1
        
        for angle in range(start, end + direccion, direccion):
            self.setAngle(angle)
            sleep(delay)
            

class Servo360:
    def __init__(self, pin: int):
        self.servo = PWM(Pin(pin))
        self.servo.freq(50)
        self.speed = 0
        
        
    def setSpeed(self, speed: int):
        
        if speed == 0:
            self.speed = 0
            return self.servo.duty(75)
        if -3 <= speed <= -1:
            self.speed = speed
            duty = int(map(speed, -1, -3, 73, 71))
            return self.servo.duty(duty)
        if 1 <= speed <= 3:
            self.speed = speed
            duty = int(map(speed, 1, 3, 80, 82))
            return self.servo.duty(duty)   
        
    def active(self, speed: int, duration: float):
        if speed < -3 or 3 < speed:
            return
        
        self.setSpeed(speed)
        start_time = time()
        while time() - start_time < duration:
            pass
        self.setSpeed(0)
        
        
if __name__ == "__main__":
    select = 4
    if select == 1:
        s = Servo180(4)
        while True:
            s.setAngle(int(input("angulo: ")))
            print(s.angle)
    
    elif select == 2:
        s = Servo180(4)
        while True:
            start_angle = int(input("angulo inicial: "))
            end_angle = int(input("angulo final: "))
            duration = float(input("Duración (segundos): "))
            s.smoothTransition(start_angle, end_angle, duration)
            print(f"Ángulo final alcanzado: {s.angle}")
            
    elif select == 3:
        s = Servo360(12)
        while True:
            s.setSpeed(int(input("velocidad: "))) 
            print(s.servo)
            
    elif select ==4:
        s = Servo360(12)
        while True:
            speed = int(input("Velocidad: "))
            duration = float(input("Duración (segundos): "))
            s.active(speed, duration)
            print(f"Velocidad establecida: {s.speed}")