"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instruction_1 = require("./instruction");
class MutateValueInstruction extends instruction_1.Instruction {
    constructor(ID, instructionType, page, leftValue, rightValue, name, game) {
        super(ID, instructionType, page, name, game);
        this.leftValue = leftValue;
        this.rightValue = rightValue;
    }
    set leftValue(value) {
        this._LEFT_VALUE = value;
        this.called = true;
    }
    get leftValue() {
        return this._LEFT_VALUE;
    }
    set rightValue(value) {
        this._RIGHT_VALUE = value;
        this.called = true;
    }
    get rightValue() {
        return this._RIGHT_VALUE;
    }
    execute(executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        const valueLeft = this.leftValue.getObject(executionOrder);
        const right = this.rightValue.getValue(executionOrder);
        return [(e) => { valueLeft.set(right, e); }];
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            page: this.page,
            leftValue: this.leftValue,
            rightValue: this.rightValue,
        });
    }
}
exports.MutateValueInstruction = MutateValueInstruction;
//# sourceMappingURL=mutateValueInstruction.js.map