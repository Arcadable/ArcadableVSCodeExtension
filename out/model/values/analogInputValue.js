"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NumberValueType_1 = require("./NumberValueType");
class AnalogInputValue extends NumberValueType_1.NumberValueType {
    constructor(ID, type, page, index, name, game) {
        super(ID, type, page, name, game);
        this.index = index;
    }
    set index(value) {
        this._INDEX = value;
        this.called = true;
    }
    get index() {
        return this._INDEX;
    }
    get(executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        return this.game.systemConfig.analogInputValues[this.index];
    }
    set(newValue, executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
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
            index: this.index,
        });
    }
}
exports.AnalogInputValue = AnalogInputValue;
//# sourceMappingURL=analogInputValue.js.map