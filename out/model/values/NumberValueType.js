"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const value_1 = require("./value");
class NumberValueType extends value_1.Value {
}
exports.NumberValueType = NumberValueType;
class NumberValueTypePointer extends value_1.ValuePointer {
    getObject(executionOrder) {
        return this.game.values[this.ID];
    }
    getValue(executionOrder) {
        return this.game.values[this.ID].get(executionOrder);
    }
}
exports.NumberValueTypePointer = NumberValueTypePointer;
//# sourceMappingURL=NumberValueType.js.map