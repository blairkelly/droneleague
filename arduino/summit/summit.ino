
#include <Servo.h> 

Servo servoWheel;
Servo servoThrottle;
Servo servoHighLow;
Servo servoDiffFront;
Servo servoDiffBack;

//com
int incomingByte;
int usbCommandVal = 0;
boolean usbGotCommandVal = false;
int usbCommand = 0;
String sBuffer = "";

//variables
//wheel
int default_uS_wheel = 1500;
int wheelPWMctr = default_uS_wheel;
int wheelPWMmin = 1200;  //fd 1085, default
int wheelPWMmax = 1800;  //fd 1890, default
//throttle
int default_uS_throttle = 1473;
int thrPWMctr = default_uS_throttle;
int thrPWMminDefault = 974;
int thrPWMmaxDefault = 1969;
//high/low gear
int uS_highLow_high = 1850; //high gear, 1927, default.
int uS_highLow_low = 1200; //low gear, 1012
//differential, front
int uS_diffFront_unlocked = 1250; //unlocked, 1024, default
int uS_diffFront_locked = 1850; //locked, 1940
//differential, back
int uS_diffBack_unlocked = 1000;  //unlocked, 1005, default
int uS_diffBack_locked = 1640;    //locked, 1919;
//batteries
unsigned long batt_read_time = millis();
int batt_read_delay = 1000;
int b1_0 = A0;
int b1_1 = A2;
int b2_0 = A1;
int b2_1 = A3;

int uS_wheel = default_uS_wheel;     // channel 1.  Ana In Ch.0 uS var - wheel
int uS_throttle = default_uS_throttle;    // channel 2 Ana In Ch.1 uS var - throttle


void setup() {            //This function gets called when the Arduino starts
    Serial.begin(57600);   //This code sets up the Serial port at 115200 baud rate

    servoWheel.attach(3);
    servoWheel.writeMicroseconds(default_uS_wheel);  // wheel default.
    servoThrottle.attach(5);
    servoThrottle.writeMicroseconds(default_uS_throttle);  // throttle default.
    servoHighLow.attach(6);
    servoHighLow.writeMicroseconds(uS_highLow_high);
    servoDiffFront.attach(9);
    servoDiffFront.writeMicroseconds(uS_diffFront_unlocked);
    servoDiffBack.attach(10);
    servoDiffBack.writeMicroseconds(uS_diffBack_unlocked);
}

void printsbuffer () {
    //print sBuffer
    if(sBuffer != "") {
        Serial.println(sBuffer);
        sBuffer = "";
    }
}
void addtosbuffer (String param, String value) {
    if(sBuffer == "") {
        sBuffer = "t=" + (String)millis() + "&" + param + "=" + value;
    } else {
        sBuffer = sBuffer + "&" + param + "=" + value;
    }
}
void monitorBatteries () {
    if ((millis() - batt_read_time) > batt_read_delay) {
        int b1_0_reading = (analogRead(b1_0) + analogRead(b1_0) + analogRead(b1_0)) / 3;
        if (b1_0_reading > 100) {
            int b1_reading = (analogRead(b1_1) + analogRead(b1_1) + analogRead(b1_1)) / 3;
            float b1_0_voltage = ((float)b1_0_reading / 1023.0) * 5.0;
            float b1_voltage = ((float)b1_reading / 1023.0) * 10.0;
            float b1_1_voltage = b1_voltage - b1_0_voltage;
            addtosbuffer("b1", (String)b1_voltage);
            addtosbuffer("b1_0", (String)b1_0_voltage);
            addtosbuffer("b1_1", (String)b1_1_voltage);
        }
        int b2_0_reading = (analogRead(b2_0) + analogRead(b2_0) + analogRead(b2_0)) / 3;
        if (b2_0_reading > 100) {
            int b2_reading = (analogRead(b2_1) + analogRead(b2_1) + analogRead(b2_1)) / 3;
            float b2_0_voltage = ((float)b2_0_reading / 1023.0) * 5.0;
            float b2_voltage = ((float)b2_reading / 1023.0) * 10.0;
            float b2_1_voltage = b2_voltage - b2_0_voltage;
            addtosbuffer("b2", (String)b2_voltage);
            addtosbuffer("b2_0", (String)b2_0_voltage);
            addtosbuffer("b2_1", (String)b2_1_voltage);
        }
        batt_read_time = millis();
    }
}

void delegate() {
    if (usbCommand == 87) {
        //W = 87
        if (usbCommandVal < wheelPWMmin) {
            usbCommandVal = wheelPWMmin;
        }
        else if (usbCommandVal > wheelPWMmax) {
            usbCommandVal = wheelPWMmax;
        }
        servoWheel.writeMicroseconds(usbCommandVal);  // wheel
    }
    else if (usbCommand == 84) {
        //T = 84
        if (usbCommandVal < thrPWMminDefault || usbCommandVal > thrPWMmaxDefault) {
            usbCommandVal = thrPWMctr;
        }
        servoThrottle.writeMicroseconds(usbCommandVal);  // throttle
    }
    else if (usbCommand == 72) {
        //H = 72
        if (usbCommandVal == 0) {
            servoHighLow.writeMicroseconds(uS_highLow_low);
        }
        else {
            servoHighLow.writeMicroseconds(uS_highLow_high);
        }
    }
    else if (usbCommand == 70) {
        //F = 70
        if (usbCommandVal == 0) {
            servoDiffFront.writeMicroseconds(uS_diffFront_unlocked);
        }
        else {
            servoDiffFront.writeMicroseconds(uS_diffFront_locked);
        }
    }
    else if (usbCommand == 66) {
        //B = 66
        if (usbCommandVal == 0) {
            servoDiffBack.writeMicroseconds(uS_diffBack_unlocked);
        }
        else {
            servoDiffBack.writeMicroseconds(uS_diffBack_locked);
        }
    }
    usbCommand = 0;
    usbCommandVal = 0;
    usbGotCommandVal = false;
    delay(1);
}

void serialListen()
{
    if(Serial.available() > 0) {
        if (usbCommand == 0) { 
            incomingByte = Serial.read();
            if (incomingByte != 32 && incomingByte != 13) {
                usbCommand = incomingByte;
            }
        }
        else {
            if (!usbGotCommandVal) {
                usbCommandVal = Serial.parseInt();
                usbGotCommandVal = true;
            }
            else {
                incomingByte = Serial.read();
                if (incomingByte == 32 || incomingByte == 13) {
                    delegate();
                }
            }
        }
    }
}

void loop() {             //This function loops while the arduino is powered
    //monitorBatteries();
    serialListen();
    printsbuffer();
}