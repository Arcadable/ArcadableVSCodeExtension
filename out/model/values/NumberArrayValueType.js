"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const value_1 = require("./value");
class NumberArrayValueType extends value_1.Value {
}
exports.NumberArrayValueType = NumberArrayValueType;
class NumberArrayValueTypePointer extends value_1.ValuePointer {
    getObject(executionOrder) {
        return this.game.values[this.ID];
    }
    getValue(executionOrder) {
        return this.game.values[this.ID].get(executionOrder);
    }
}
exports.NumberArrayValueTypePointer = NumberArrayValueTypePointer;
//# sourceMappingURL=NumberArrayValueType.js.map