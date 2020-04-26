"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instruction_1 = require("./instruction");
class RunConditionInstruction extends instruction_1.Instruction {
    constructor(ID, instructionType, page, evaluationValue, successSet, failSet, name, game) {
        super(ID, instructionType, page, name, game);
        this.evaluationValue = evaluationValue;
        this.successSet = successSet;
        this.failSet = failSet;
    }
    set evaluationValue(value) {
        this._EVALUATION_VALUE = value;
        this.called = true;
    }
    get evaluationValue() {
        return this._EVALUATION_VALUE;
    }
    set successSet(value) {
        this._SUCCESS_SET = value;
        this.called = true;
    }
    get successSet() {
        return this._SUCCESS_SET;
    }
    set failSet(value) {
        this._FAIL_SET = value;
        this.called = true;
    }
    get failSet() {
        return this._FAIL_SET;
    }
    execute(executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        if (this.evaluationValue.getObject(executionOrder).isTruthy(executionOrder)) {
            return this.successSet.execute(executionOrder);
        }
        else if (this.failSet) {
            return this.failSet.execute(executionOrder);
        }
        return [];
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            page: this.page,
            evaluationValue: this.evaluationValue,
            successSet: this.successSet,
            failSet: this.failSet
        });
    }
}
exports.RunConditionInstruction = RunConditionInstruction;
//# sourceMappingURL=runConditionInstruction.js.map