"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SystemConfigType;
(function (SystemConfigType) {
    SystemConfigType[SystemConfigType["screenWidth"] = 0] = "screenWidth";
    SystemConfigType[SystemConfigType["screenHeight"] = 1] = "screenHeight";
    SystemConfigType[SystemConfigType["minMillisPerFrame"] = 2] = "minMillisPerFrame";
    SystemConfigType[SystemConfigType["currentMillis"] = 3] = "currentMillis";
    SystemConfigType[SystemConfigType["isZigZag"] = 4] = "isZigZag";
})(SystemConfigType = exports.SystemConfigType || (exports.SystemConfigType = {}));
exports.systemConfigTypes = Object.keys(SystemConfigType).filter((key) => isNaN(Number(SystemConfigType[key]))).map((value) => {
    switch (Number(value)) {
        case SystemConfigType.screenWidth:
            return { viewValue: 'Screen width', value: Number(value) };
        case SystemConfigType.screenHeight:
            return { viewValue: 'Screen height', value: Number(value) };
        case SystemConfigType.minMillisPerFrame:
            return { viewValue: 'Min millis per frame', value: Number(value) };
        case SystemConfigType.currentMillis:
            return { viewValue: 'Current millis', value: Number(value) };
        case SystemConfigType.isZigZag:
            return { viewValue: 'Is zig zag', value: Number(value) };
        default:
            return { viewValue: '', value: 0 };
    }
});
class SystemConfig {
    constructor(screenWidth, screenHeight, minMillisPerFrame, layoutIsZigZag, digitalInputPinsAmount, analogInputPinsAmount, startMillis) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.minMillisPerFrame = minMillisPerFrame;
        this.layoutIsZigZag = layoutIsZigZag;
        this.digitalInputPinsAmount = digitalInputPinsAmount;
        this.analogInputPinsAmount = analogInputPinsAmount;
        this.startMillis = startMillis;
        this.digitalInputValues = [];
        this.realTimeDigitalInputValues = {};
        this.analogInputValues = [];
        this.realTimeAnalogInputValues = {};
        for (let i = 0; i < this.digitalInputPinsAmount; i++) {
            this.realTimeDigitalInputValues[i] = 0;
        }
        for (let i = 0; i < this.analogInputPinsAmount; i++) {
            this.realTimeAnalogInputValues[i] = 512;
        }
        this.digitalInputValues = this.digitalInputValues.fill(0);
        this.analogInputValues = this.analogInputValues.fill(512);
    }
    get(type) {
        switch (type) {
            case SystemConfigType.screenWidth: {
                return this.screenWidth;
            }
            case SystemConfigType.screenHeight: {
                return this.screenHeight;
            }
            case SystemConfigType.minMillisPerFrame: {
                return this.minMillisPerFrame;
            }
            case SystemConfigType.currentMillis: {
                return new Date().getTime() - this.startMillis;
            }
            case SystemConfigType.isZigZag: {
                return this.layoutIsZigZag ? 1 : 0;
            }
        }
    }
    fetchInputValues() {
        for (let i = 0; i < this.digitalInputPinsAmount; i++) {
            this.digitalInputValues[i] = this.digitalRead(i);
        }
        for (let i = 0; i < this.analogInputPinsAmount; i++) {
            this.analogInputValues[i] = this.analogRead(i);
        }
    }
    digitalRead(input) {
        return this.realTimeDigitalInputValues[input];
    }
    analogRead(input) {
        return this.realTimeAnalogInputValues[input];
    }
    stringify() {
        return JSON.stringify({
            screenWidth: this.screenWidth,
            screenHeight: this.screenHeight,
            minMillisPerFrame: this.minMillisPerFrame,
            layoutIsZigZag: this.layoutIsZigZag,
            digitalInputPinsAmount: this.digitalInputPinsAmount,
            analogInputPinsAmount: this.analogInputPinsAmount
        });
    }
}
exports.SystemConfig = SystemConfig;
//# sourceMappingURL=systemConfig.js.map