
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
int wheelPWMctr = 1500;
int wheelPWMmin = 1200;  //fd 1085, default
int wheelPWMmax = 1800;  //fd 1890, default
//throttle
int thrPWMctr = 1473;
int thrPWMminDefault = 974;
int thrPWMmaxDefault = 1969;

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