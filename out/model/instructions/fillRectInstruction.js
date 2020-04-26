"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instruction_1 = require("./instruction");
class FillRectInstruction extends instruction_1.Instruction {
    constructor(ID, instructionType, page, colorValue, x1Value, y1Value, x2Value, y2Value, name, game) {
        super(ID, instructionType, page, name, game);
        this.colorValue = colorValue;
        this.x1Value = x1Value;
        this.y1Value = y1Value;
        this.x2Value = x2Value;
        this.y2Value = y2Value;
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
    execute(executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        const topLeftDrawX = this.x1Value.getValue(executionOrder);
        const topLeftDrawY = this.y1Value.getValue(executionOrder);
        const bottomRightDrawX = this.x2Value.getValue(executionOrder);
        const bottomRightDrawY = this.y2Value.getValue(executionOrder);
        const width = bottomRightDrawX - topLeftDrawX;
        const height = bottomRightDrawY - topLeftDrawY;
        const drawRectColor = this.colorValue.getValue(executionOrder);
        return [(e) => {
                this.game.drawInstruction.next({
                    command: 'fillRect',
                    topLeftDrawX,
                    topLeftDrawY,
                    width,
                    height,
                    drawRectColor,
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
        });
    }
}
exports.FillRectInstruction = FillRectInstruction;
//# sourceMappingURL=fillRectInstruction.js.map