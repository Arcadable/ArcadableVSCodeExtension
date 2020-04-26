"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instruction_1 = require("./instruction");
class DrawTextInstruction extends instruction_1.Instruction {
    constructor(ID, instructionType, page, colorValue, scaleValue, xValue, yValue, name, game) {
        super(ID, instructionType, page, name, game);
        this.colorValue = colorValue;
        this.scaleValue = scaleValue;
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
    set scaleValue(value) {
        this._SCALE_VALUE = value;
        this.called = true;
    }
    get scaleValue() {
        return this._SCALE_VALUE;
    }
    set textValue(value) {
        this._TEXT_VALUE = value;
        this.called = true;
    }
    get textValue() {
        return this._TEXT_VALUE;
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
        const pixelTextX = this.xValue.getValue(executionOrder);
        let pixelTextY = this.yValue.getValue(executionOrder);
        const scale = this.scaleValue.getValue(executionOrder);
        pixelTextY += scale * 8;
        const textColor = this.colorValue.getValue(executionOrder);
        const text = this.textValue.getValue(executionOrder).reduce((acc, curr) => acc + String.fromCharCode(curr), '');
        return [(e) => {
                this.game.drawInstruction.next({
                    command: 'drawText',
                    pixelTextX,
                    pixelTextY,
                    scale,
                    textColor,
                    text,
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
            scale: this.scaleValue,
            text: this.textValue,
            xValue: this.xValue,
            yValue: this.yValue,
        });
    }
}
exports.DrawTextInstruction = DrawTextInstruction;
//# sourceMappingURL=drawTextInstruction.js.map