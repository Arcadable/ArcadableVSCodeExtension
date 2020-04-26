"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instruction_1 = require("./instruction");
class ClearInstruction extends instruction_1.Instruction {
    constructor(ID, instructionType, page, name, game) {
        super(ID, instructionType, page, name, game);
    }
    execute(executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        return [(e) => {
                this.game.drawInstruction.next({
                    command: 'clear'
                });
            }];
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
exports.ClearInstruction = ClearInstruction;
//# sourceMappingURL=clearInstruction.js.map