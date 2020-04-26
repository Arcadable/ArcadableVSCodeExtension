"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logicElement_1 = require("../logicElement");
var InstructionType;
(function (InstructionType) {
    InstructionType[InstructionType["MutateValue"] = 0] = "MutateValue";
    InstructionType[InstructionType["RunCondition"] = 1] = "RunCondition";
    InstructionType[InstructionType["DrawPixel"] = 2] = "DrawPixel";
    InstructionType[InstructionType["DrawLine"] = 3] = "DrawLine";
    InstructionType[InstructionType["DrawRect"] = 4] = "DrawRect";
    InstructionType[InstructionType["FillRect"] = 5] = "FillRect";
    InstructionType[InstructionType["DrawCircle"] = 6] = "DrawCircle";
    InstructionType[InstructionType["FillCircle"] = 7] = "FillCircle";
    InstructionType[InstructionType["DrawTriangle"] = 8] = "DrawTriangle";
    InstructionType[InstructionType["FillTriangle"] = 9] = "FillTriangle";
    InstructionType[InstructionType["DrawText"] = 10] = "DrawText";
    InstructionType[InstructionType["Clear"] = 11] = "Clear";
    InstructionType[InstructionType["SetRotation"] = 12] = "SetRotation";
})(InstructionType = exports.InstructionType || (exports.InstructionType = {}));
exports.instructionTypes = Object.keys(InstructionType)
    .filter(key => isNaN(Number(InstructionType[key]))).map((value) => {
    switch (Number(value)) {
        case InstructionType.MutateValue:
            return { viewValue: 'Mutate value', value: Number(value) };
        case InstructionType.RunCondition:
            return { viewValue: 'Run condition', value: Number(value) };
        case InstructionType.DrawPixel:
            return { viewValue: 'Draw pixel', value: Number(value) };
        case InstructionType.DrawLine:
            return { viewValue: 'Draw line', value: Number(value) };
        case InstructionType.DrawRect:
            return { viewValue: 'Draw rect', value: Number(value) };
        case InstructionType.FillRect:
            return { viewValue: 'Fill rect', value: Number(value) };
        case InstructionType.DrawCircle:
            return { viewValue: 'Draw circle', value: Number(value) };
        case InstructionType.FillCircle:
            return { viewValue: 'Fill circle', value: Number(value) };
        case InstructionType.DrawTriangle:
            return { viewValue: 'Draw triangle', value: Number(value) };
        case InstructionType.FillTriangle:
            return { viewValue: 'Fill triangle', value: Number(value) };
        case InstructionType.DrawText:
            return { viewValue: 'Draw text', value: Number(value) };
        case InstructionType.Clear:
            return { viewValue: 'Clear', value: Number(value) };
        case InstructionType.SetRotation:
            return { viewValue: 'Set rotation', value: Number(value) };
        default:
            return { viewValue: '', value: 0 };
    }
});
class Instruction extends logicElement_1.LogicElement {
    constructor(ID, instructionType, page, name, game) {
        super(ID, page, name, game);
        this._INSTRUCTION_TYPE = 0;
        this.instructionType = instructionType;
    }
    set instructionType(value) {
        this._INSTRUCTION_TYPE = value;
        this.called = true;
    }
    get instructionType() {
        return this._INSTRUCTION_TYPE;
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            page: this.page,
        });
    }
}
exports.Instruction = Instruction;
class InstructionPointer {
    constructor(ID, game) {
        this.ID = ID;
        this.game = game;
    }
    execute(executionOrder) {
        return this.game.instructions[this.ID].execute(executionOrder);
    }
}
exports.InstructionPointer = InstructionPointer;
//# sourceMappingURL=instruction.js.map