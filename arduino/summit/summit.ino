
#include <Servo.h> 

Servo servoWheel;
Servo servoThrottle;

//com
String sBuffer = "";
String usbInstructionDataString = "";
int usbCommandVal = 0;
boolean USBcommandExecuted = true;
String usbCommand = "";

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
int uS_highLow_high = 1927; //high gear, 1927, default.
int uS_highLow_low = 1012; //low gear, 1012
//differential, front
int uS_diffFront_unlocked = 1024; //unlocked, 1024, default
int uS_diffFront_locked = 1940; //locked, 1940
//differential, back
int uS_diffBack_unlocked = 1005;  //unlocked, 1005, default
int uS_diffBack_locked = 1919;    //locked, 1919;

int uS_wheel = default_uS_wheel;     // channel 1.  Ana In Ch.0 uS var - wheel
int uS_throttle = default_uS_throttle;    // channel 2 Ana In Ch.1 uS var - throttle
int uS_highlow = uS_highLow_high;      // channel 3, high and low gear. default is 1927 (high gear).
int uS_diffFront = uS_diffFront_unlocked;        // channel 4, front differential
int uS_diffBack = uS_diffBack_unlocked;        // channel 5, rear differntial.

void setup() {            //This function gets called when the Arduino starts
    Serial.begin(57600);   //This code sets up the Serial port at 115200 baud rate

    servoWheel.attach(3);
    servoWheel.writeMicroseconds(default_uS_wheel);  // wheel default.
    servoThrottle.attach(5);
    servoThrottle.writeMicroseconds(default_uS_throttle);  // throttle default.
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

void delegate(String cmd, int cmdval) {
    if (cmd.equals("W")) {
          servoWheel.writeMicroseconds(cmdval);  // wheel
    } else if (cmd.equals("T")) {
          servoThrottle.writeMicroseconds(cmdval);  // throttle
    }
}

void serialListen()
{
    char arduinoSerialData; //FOR CONVERTING BYTE TO CHAR. here is stored information coming from the arduino.
    String currentChar = "";
    if(Serial.available() > 0) {
        arduinoSerialData = char(Serial.read());   //BYTE TO CHAR.
        currentChar = (String)arduinoSerialData; //incoming data equated to c.
        if(!currentChar.equals("1") && !currentChar.equals("2") && !currentChar.equals("3") && !currentChar.equals("4") && !currentChar.equals("5") && !currentChar.equals("6") && !currentChar.equals("7") && !currentChar.equals("8") && !currentChar.equals("9") && !currentChar.equals("0") && !currentChar.equals(".")) { 
            //the character is not a number, not a value to go along with a command,
            //so it is probably a command.
            if(!usbInstructionDataString.equals("")) {
                //usbCommandVal = Integer.parseInt(usbInstructionDataString);
                char charBuf[30];
                usbInstructionDataString.toCharArray(charBuf, 30);
                usbCommandVal = atoi(charBuf);

            }
            if((USBcommandExecuted == false) && (arduinoSerialData == 13)) {
                delegate(usbCommand, usbCommandVal);
                USBcommandExecuted = true;
                Serial.println("ROGER");
            }
            if((arduinoSerialData != 13) && (arduinoSerialData != 10)) {
                usbCommand = currentChar;
            }
            usbInstructionDataString = "";
        } else {
            //in this case, we're probably receiving a command value.
            //store it
            usbInstructionDataString = usbInstructionDataString + currentChar;
            USBcommandExecuted = false;
        }
    }
}

void loop() {             //This function loops while the arduino is powered
    serialListen();
    printsbuffer();
}