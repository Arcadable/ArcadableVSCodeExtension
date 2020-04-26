"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instruction_1 = require("./instruction");
class DrawTriangleInstruction extends instruction_1.Instruction {
    constructor(ID, instructionType, page, colorValue, x1Value, y1Value, x2Value, y2Value, x3Value, y3Value, name, game) {
        super(ID, instructionType, page, name, game);
        this.colorValue = colorValue;
        this.x1Value = x1Value;
        this.y1Value = y1Value;
        this.x2Value = x2Value;
        this.y2Value = y2Value;
        this.x3Value = x3Value;
        this.y3Value = y3Value;
    }
    set colorValue(value) {
        this._COLOR_VALUE = value;
        this.called = true;
    }
    get colorValue() {
        return this._COLOR_VALUE;
    }
    set x1Value(value) {
        this._X1_VALUE = value;
        this.called = true;
    }
    get x1Value() {
        return this._X1_VALUE;
    }
    set y1Value(value) {
        this._Y1_VALUE = value;
        this.called = true;
    }
    get y1Value() {
        return this._Y1_VALUE;
    }
    set x2Value(value) {
        this._X2_VALUE = value;
        this.called = true;
    }
    get x2Value() {
        return this._X2_VALUE;
    }
    set y2Value(value) {
        this._Y2_VALUE = value;
        this.called = true;
    }
    get y2Value() {
        return this._Y2_VALUE;
    }
    set x3Value(value) {
        this._X3_VALUE = value;
        this.called = true;
    }
    get x3Value() {
        return this._X3_VALUE;
    }
    set y3Value(value) {
        this._Y3_VALUE = value;
        this.called = true;
    }
    get y3Value() {
        return this._Y3_VALUE;
    }
    execute(executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        const triangleColor = this.colorValue.getValue(executionOrder);
        const pixel1X = this.x1Value.getValue(executionOrder);
        const pixel1Y = this.y1Value.getValue(executionOrder);
        const pixel2X = this.x2Value.getValue(executionOrder);
        const pixel2Y = this.y2Value.getValue(executionOrder);
        const pixel3X = this.x3Value.getValue(executionOrder);
        const pixel3Y = this.y3Value.getValue(executionOrder);
        return [(e) => {
                this.game.drawInstruction.next({
                    command: 'drawTriangle',
                    triangleColor,
                    pixel1X,
                    pixel1Y,
                    pixel2X,
                    pixel2Y,
                    pixel3X,
                    pixel3Y,
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
            x1Value: this.x1Value,
            y1Value: this.y1Value,
            x2Value: this.x2Value,
            y2Value: this.y2Value,
            x3Value: this.x3Value,
            y3Value: this.y3Value,
        });
    }
}
exports.DrawTriangleInstruction = DrawTriangleInstruction;
//# sourceMappingURL=drawTriangleInstruction.js.map