"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instruction_1 = require("./instruction");
class FillCircleInstruction extends instruction_1.Instruction {
    constructor(ID, instructionType, page, colorValue, radiusValue, xValue, yValue, name, game) {
        super(ID, instructionType, page, name, game);
        this.colorValue = colorValue;
        this.radiusValue = radiusValue;
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
    set radiusValue(value) {
        this._RADIUS_VALUE = value;
        this.called = true;
    }
    get radiusValue() {
        return this._RADIUS_VALUE;
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
        const color = this.colorValue.getValue(executionOrder);
        const radius = this.radiusValue.getValue(executionOrder);
        const centerX = this.xValue.getValue(executionOrder);
        const centerY = this.yValue.getValue(executionOrder);
        return [(e) => {
                this.game.drawInstruction.next({
                    command: 'fillCircle',
                    color,
                    radius,
                    centerX,
                    centerY
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
            radiusValue: this.radiusValue,
            xValue: this.xValue,
            yValue: this.yValue,
        });
    }
}
exports.FillCircleInstruction = FillCircleInstruction;
//# sourceMappingURL=fillCircleInstruction.js.map