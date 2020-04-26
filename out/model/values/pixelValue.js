"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NumberValueType_1 = require("./NumberValueType");
class PixelValue extends NumberValueType_1.NumberValueType {
    constructor(ID, type, page, xCalc, yCalc, name, game) {
        super(ID, type, page, name, game);
        this.XCalc = xCalc;
        this.YCalc = yCalc;
    }
    set XCalc(value) {
        this._X_CALC = value;
        this.called = true;
    }
    get XCalc() {
        return this._X_CALC;
    }
    set YCalc(value) {
        this._Y_CALC = value;
        this.called = true;
    }
    get YCalc() {
        return this._Y_CALC;
    }
    get(executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        /*new Promise((res, rej) => {
            this.game.drawInstruction.next({
                command: 'getPixel',
                callback: (color: number) => {
                    res(color);
                }
            })
        }).then((color) => {
            return color;
        })*/
        return 0;
    }
    set(newValue, executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        this.game.drawInstruction.next({
            command: 'drawPixel',
            x: this.XCalc.getValue(executionOrder),
            y: this.YCalc.getValue(executionOrder),
            pixelColor: newValue,
        });
    }
    isTruthy(executionOrder) {
        return this.get(executionOrder) !== 0;
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            type: this.type,
            page: this.page,
            xCalc: this.XCalc.ID,
            yCalc: this.YCalc.ID
        });
    }
}
exports.PixelValue = PixelValue;
//# sourceMappingURL=pixelValue.js.map