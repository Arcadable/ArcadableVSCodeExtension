import { Arcadable } from '../model/arcadable';


export enum SystemConfigType { screenWidth, screenHeight, minMillisPerFrame, currentMillis, isZigZag }
export const systemConfigTypes = Object.keys(SystemConfigType).filter((key: string) => isNaN(Number(SystemConfigType[key as any]))).map((value) => {
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
        return { viewValue: '', value: 0};
    }
});

export class SystemConfig {
    digitalInputValues: (1 | 0)[] = [];
    realTimeDigitalInputValues: {[key: number]: (1 | 0)} = {};
    analogInputValues: number[] = [];
    realTimeAnalogInputValues: {[key: number]: number} = {};
    constructor(
        public screenWidth: number,
        public screenHeight: number,
        public minMillisPerFrame: number,
        public layoutIsZigZag: boolean,
        public digitalInputPinsAmount: number,
        public analogInputPinsAmount: number,
        public startMillis: number
    ) {
        for (let i = 0; i < this.digitalInputPinsAmount; i++) {
            this.realTimeDigitalInputValues[i] = 0;
        }
        for (let i = 0; i < this.analogInputPinsAmount; i++) {
            this.realTimeAnalogInputValues[i] = 512;
        }
        this.digitalInputValues = this.digitalInputValues.fill(0);
        this.analogInputValues = this.analogInputValues.fill(512);

    }

    get(type: SystemConfigType) {
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
    digitalRead(input: number) {
        return this.realTimeDigitalInputValues[input];
    }
    analogRead(input: number) {
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
