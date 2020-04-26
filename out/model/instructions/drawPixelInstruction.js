"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instruction_1 = require("./instruction");
class DrawPixelInstruction extends instruction_1.Instruction {
    constructor(ID, instructionType, page, colorValue, xValue, yValue, name, game) {
        super(ID, instructionType, page, name, game);
        this.colorValue = colorValue;
        this.xValue = xValue;
        this.yValue = yValue;
    }
    set colorValue(value) {
        this._COLOR_VALUE = value;
        this.called = true;
    }
    get colorValue() {
        return this._COLOR_VALUE;
    }
    set xValue(value) {
        this._X_VALUE = value;
        this.called = true;
    }
    get xValue() {
        return this._X_VALUE;
    }
    set yValue(value) {
        this._Y_VALUE = value;
        this.called = true;
    }
    get yValue() {
        return this._Y_VALUE;
    }
    execute(executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        const x = this.xValue.getValue(executionOrder);
        const y = this.yValue.getValue(executionOrder);
        const pixelColor = this.colorValue.getValue(executionOrder);
        return [(e) => {
                this.game.drawInstruction.next({
                    command: 'drawPixel',
                    x,
                    y,
                    pixelColor,
                });
            }];
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            page: this.page,
            colorValue: this.colorValue,
            xValue: this.xValue,
            yValue: this.yValue,
        });
    }
}
exports.DrawPixelInstruction = DrawPixelInstruction;
//# sourceMappingURL=drawPixelInstruction.js.map