WIP Arcadable script extension.

All values are global.
Implemented value types:
```
// Regular number value
// Truthy if value != 0
varName: Number = 1;
varName: Number = 0.5;

// Input values, will update automatically to mirror to user input.
// Truthy if value != 0
varName: Analog = 1;
varName: Digital = 0.5;

// Evaluation, will be evaluated every time the value is used.
// Unless it is a "static" evaluation, which will only be evaluated the first time this value is used.
// Available evaluations: +, -, *, /, %, &, |, ^, <<, >>, pow, ==, !=, >, <, >=, <=
// Truthy if evaluation resolves to != 0
varName: Eval = 2 * otherVarName;
varName: Eval = static 2 * otherVarName;

// Pixel value, represents the color value of the pixel at the defined location.
// When set, the color at that position will change.
// Reading this value will return the color of the pixel at the defined location.
// Truthy if color at defined pixel position != 0
varName: Pixel = [5, 5];
varName: Pixel = [pixelPosXVar, pixelPosYVar];

// System config value, represents system information.
// Available values: ScreenHeight, ScreenWidth, TargetMainMillis, TargetRenderMillis, CurrentMillis, IsZigZag
// Truthy if value resolves to != 0
varName: Config = ScreenHeight;

// Text value, thus far only used in draw.drawText instruction.
// Truthy if length != 0
varName: String = "my text";
varName: String = 'my text';

// List value. Fixed size. Can be used with any data type, except for List<..> type (multidimensional arrays are not supported).
// Always truthy.
varName: List<Number> = [otherVarName, 2, 2.5];

// List value pointer. Points to a specific value of a list.
// Truthy if value at list position is truthy.
varName: ListValue = myList[1];
varName: ListValue = myList[otherVarName];
```

Implemented instructions: 
```
// Drawing
draw.drawPixel(color, x, y);
draw.drawLine(color, x1, y1, x2, y2);
draw.drawRect(color, tlX, tlY, brX, brY);
draw.fillRect(color, tlX, tlY, brX, brY);
draw.drawCircle(color, radius, x, y);
draw.fillCircle(color, radius, x, y);
draw.drawTriangle(color, x1, y1, x2, y2, x3, y3);
draw.fillTriangle(color, x1, y1, x2, y2, x3, y3);
draw.drawText(color, size, text, x, y);
draw.clear;
draw.setRotation(rotation);

// Writing to console
log(value);

// Conditionals
if (varName) {

} else {

}

// Executing functions
execute(myFunction);

// Mutating values
// Mutatable values: Number, ListValue (pointing to a mutable value), Pixel, String
varName = otherVarName * 2;
varName = 5; 
```

All functions are global.
Functions: 
```
// Compiler requires two default functions to be present at all times.

// The main function is called a certain amount of times, based on the "mainsPerSecond" property in arcadable.config.json.
main: Function {

}

// The render function is called a certain amount of times, based on the "rendersPerSecond" property in arcadable.config.json.
render: Function {

}

// Any other functions can be defined in the same way.
myFunction: Function {

}
```

All values and functions defined in any imported file are accessible in any file of the program (all values and functions are global, also across files).
Files must have .arc extension.
Imports:
```
import "myFile.arc";
import "dir/myFile.arc";
import "../myFile.arc";
import "../dir/myFile.arc";
```

arcadable.config.json
```
{
    "project": {
        "name": "Test",
        "version": "0.0.1",
        "main": "/src/main.arc",
        "export": "/out"
    },
    "system": {
        "screenWidth": 42,
        "screenHeight": 42,
        "mainsPerSecond": 120,
        "rendersPerSecond": 60,
        "digitalInputAmount": 16,
        "analogInputAmount": 8
    }
}
```