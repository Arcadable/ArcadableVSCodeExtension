"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logicElement_1 = require("../logicElement");
var ValueType;
(function (ValueType) {
    ValueType[ValueType["number"] = 0] = "number";
    ValueType[ValueType["pixelIndex"] = 1] = "pixelIndex";
    ValueType[ValueType["digitalInputPointer"] = 2] = "digitalInputPointer";
    ValueType[ValueType["analogInputPointer"] = 3] = "analogInputPointer";
    ValueType[ValueType["systemPointer"] = 4] = "systemPointer";
    ValueType[ValueType["list"] = 5] = "list";
    ValueType[ValueType["text"] = 6] = "text";
    ValueType[ValueType["evaluation"] = 7] = "evaluation";
})(ValueType = exports.ValueType || (exports.ValueType = {}));
exports.valueTypes = Object.keys(ValueType).filter(key => isNaN(Number(ValueType[key]))).map((value) => {
    switch (Number(value)) {
        case ValueType.number:
            return { viewValue: 'Number', value: Number(value) };
        case ValueType.pixelIndex:
            return { viewValue: 'Pixel', value: Number(value) };
        case ValueType.digitalInputPointer:
            return { viewValue: 'Digital input pointer', value: Number(value) };
        case ValueType.analogInputPointer:
            return { viewValue: 'Analog input pointer', value: Number(value) };
        case ValueType.systemPointer:
            return { viewValue: 'System value pointer', value: Number(value) };
        case ValueType.list:
            return { viewValue: 'List value pointer', value: Number(value) };
        case ValueType.text:
            return { viewValue: 'Text', value: Number(value) };
        case ValueType.evaluation:
            return { viewValue: 'Evaluation', value: Number(value) };
        default:
            return { viewValue: '', value: 0 };
    }
});
class Value extends logicElement_1.LogicElement {
    constructor(ID, type, page, name, game) {
        super(ID, page, name, game);
        this.type = type;
    }
    set type(value) {
        this._TYPE = value;
        this.called = true;
    }
    get type() {
        return this._TYPE;
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            type: this.type,
            page: this.page,
        });
    }
}
exports.Value = Value;
class ValuePointer {
    constructor(ID, game) {
        this.ID = ID;
        this.game = game;
    }
}
exports.ValuePointer = ValuePointer;
//# sourceMappingURL=value.js.map