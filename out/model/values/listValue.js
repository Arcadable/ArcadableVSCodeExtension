"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const value_1 = require("./value");
class ListValue extends value_1.Value {
    constructor(ID, type, page, currentIndex, size, values, name, game) {
        super(ID, type, page, name, game);
        this.values = values;
        this.size = size;
        this.currentIndex = currentIndex;
    }
    set currentIndex(value) {
        this._CURRENT_INDEX = value;
        this.called = true;
    }
    get currentIndex() {
        return this._CURRENT_INDEX;
    }
    set size(value) {
        this._SIZE = value;
        this.called = true;
    }
    get size() {
        return this._SIZE;
    }
    set values(values) {
        this._VALUES = values;
        this.called = true;
    }
    get values() {
        return this._VALUES;
    }
    get(executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        return this.values[this.currentIndex].getValue(executionOrder);
    }
    set(newValue, executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        this.values[this.currentIndex].getObject(executionOrder).set(newValue, executionOrder);
    }
    isTruthy(executionOrder) {
        return this.values[this.currentIndex].getObject(executionOrder).isTruthy(executionOrder);
    }
    setIndex(newIndex, executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        this.currentIndex = newIndex;
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            type: this.type,
            page: this.page,
            values: this.values,
            size: this.size,
            currentIndex: this.currentIndex
        });
    }
}
exports.ListValue = ListValue;
//# sourceMappingURL=listValue.js.map