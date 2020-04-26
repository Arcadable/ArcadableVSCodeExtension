"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instruction_1 = require("./instruction");
class SetRotationInstruction extends instruction_1.Instruction {
    constructor(ID, instructionType, page, rotationValue, name, game) {
        super(ID, instructionType, page, name, game);
        this.rotationValue = rotationValue;
    }
    set rotationValue(value) {
        this._ROTATION_VALUE = value;
        this.called = true;
    }
    get rotationValue() {
        return this._ROTATION_VALUE;
    }
    execute(executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        const rotation = this.rotationValue.getValue(executionOrder);
        return [(e) => {
                this.game.drawInstruction.next({
                    command: 'drawCircle',
                    rotation,
                });
            }];
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            page: this.page,
            rotationValue: this.rotationValue,
        });
    }
}
exports.SetRotationInstruction = SetRotationInstruction;
//# sourceMappingURL=setRotationInstruction.js.map