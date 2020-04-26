"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logicElement_1 = require("../logicElement");
class InstructionSet extends logicElement_1.LogicElement {
    constructor(ID, page, isRoot, size, instructions, name, game) {
        super(ID, page, name, game);
        this._INSTRUCTIONS = [];
        this._IS_ROOT = false;
        this.isRoot = isRoot;
        this.size = size;
        this.instructions = instructions;
    }
    set instructions(value) {
        this._INSTRUCTIONS = value;
    }
    get instructions() {
        return this._INSTRUCTIONS;
    }
    set size(value) {
        this._SIZE = value;
    }
    get size() {
        return this._SIZE;
    }
    set isRoot(value) {
        this._IS_ROOT = value;
    }
    get isRoot() {
        return this._IS_ROOT;
    }
    execute() {
        return this.instructions.map((instruction) => (e) => instruction.execute(e));
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            page: this.page,
            size: this.size,
            isRoot: this.isRoot,
            instructions: this.instructions
        });
    }
}
exports.InstructionSet = InstructionSet;
class InstructionSetPointer {
    execute(executionOrder) {
        return this.game.instructionSets[this.ID].execute();
    }
}
exports.InstructionSetPointer = InstructionSetPointer;
//# sourceMappingURL=instructionSet.js.map