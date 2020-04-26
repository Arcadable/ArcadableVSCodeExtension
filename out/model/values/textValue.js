"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NumberArrayValueType_1 = require("./NumberArrayValueType");
class TextValue extends NumberArrayValueType_1.NumberArrayValueType {
    constructor(ID, type, page, value, size, name, game) {
        super(ID, type, page, name, game);
        this.value = value;
        this.size = size;
    }
    set value(value) {
        this._VALUE = value;
        this.called = true;
    }
    get value() {
        return this._VALUE;
    }
    set size(value) {
        this._LIST_SIZE = value;
        this.called = true;
    }
    get size() {
        return this._LIST_SIZE;
    }
    get(executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        return this.value;
    }
    set(newValue, executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        this.value = newValue;
    }
    isTruthy(executionOrder) {
        return this.size > 0;
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            type: this.type,
            page: this.page,
            value: this.value,
            size: this.size
        });
    }
}
exports.TextValue = TextValue;
//# sourceMappingURL=textValue.js.map