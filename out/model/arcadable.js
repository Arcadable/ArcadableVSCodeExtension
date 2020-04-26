"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const instruction_1 = require("./instructions/instruction");
const value_1 = require("./values/value");
const fp = require('ieee-float');
class Arcadable {
    constructor(systemConfig) {
        this.resetCalled = new rxjs_1.Subject();
        this.breakEncountered = new rxjs_1.Subject();
        this.drawInstruction = new rxjs_1.Subject();
        this.values = {};
        this.instructions = {};
        this.instructionSets = {};
        this.rootInstructionSet = 0;
        this.prevMillis = 0;
        this.startMillis = 0;
        this.running = false;
        this.wait = false;
        this.waitSubjects = [];
        this.systemConfig = systemConfig;
        this.startMillis = new Date().getTime();
    }
    setGameLogic(values, instructions, instructionSets, rootInstructionSet) {
        this.values = values;
        this.instructions = instructions;
        this.instructionSets = instructionSets;
        this.rootInstructionSet = rootInstructionSet;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            Object.keys(this.values).forEach(k => {
                if (this.values[Number(k)].type === value_1.ValueType.evaluation) {
                    this.values[Number(k)]._STATIC_RESULT = undefined;
                }
            });
            this.running = true;
            while (this.running) {
                this.waitSubjects.forEach(s => s.next());
                yield this.step();
            }
        });
    }
    stop() {
        this.running = false;
    }
    step() {
        return __awaiter(this, void 0, void 0, function* () {
            this.resetCalled.next();
            this.waitSubjects = [];
            const currentMillis = new Date().getTime();
            if (currentMillis - this.prevMillis < this.systemConfig.minMillisPerFrame) {
                yield new Promise(resolve => setTimeout(resolve, this.systemConfig.minMillisPerFrame - (new Date().getTime() - this.prevMillis)));
            }
            this.doGameStep();
            this.prevMillis = new Date().getTime();
        });
    }
    doGameStep() {
        return __awaiter(this, void 0, void 0, function* () {
            this.systemConfig.fetchInputValues();
            const lastSubject = new rxjs_1.Subject();
            const rootInstructionSet = this.instructionSets[this.rootInstructionSet];
            rootInstructionSet.instructions.forEach((instructionPointer, i) => __awaiter(this, void 0, void 0, function* () {
                if (this.wait) {
                    const waitFor = new rxjs_1.Subject();
                    this.waitSubjects.push(waitFor);
                    yield waitFor.pipe(operators_1.take(1)).toPromise();
                }
                yield this.execute((executionOrder) => instructionPointer.execute(executionOrder), [i]);
                if (i + 1 === rootInstructionSet.size) {
                    lastSubject.next();
                }
            }));
            if (this.wait && rootInstructionSet.size > 0) {
                yield lastSubject.pipe(operators_1.take(1)).toPromise();
            }
        });
    }
    execute(action, executionOrder) {
        return __awaiter(this, void 0, void 0, function* () {
            if (executionOrder.length % 300 === 0) {
                const lastSubject = new rxjs_1.Subject();
                setTimeout(() => {
                    this.doExecute(action, executionOrder);
                    lastSubject.next();
                }, 0);
                yield lastSubject.pipe(operators_1.take(1)).toPromise();
            }
            else {
                this.doExecute(action, executionOrder);
            }
        });
    }
    doExecute(action, executionOrder) {
        return __awaiter(this, void 0, void 0, function* () {
            const lastSubject = new rxjs_1.Subject();
            const actions = action(executionOrder) || [];
            (this.wait ? actions.reverse() : actions).forEach((a, i) => __awaiter(this, void 0, void 0, function* () {
                if (this.wait) {
                    const waitFor = new rxjs_1.Subject();
                    this.waitSubjects.unshift(waitFor);
                    yield waitFor.pipe(operators_1.take(1)).toPromise();
                }
                yield this.execute(a, [...executionOrder, i]);
                if (i + 1 === actions.length) {
                    lastSubject.next();
                }
            }));
            if (this.wait && actions.length > 0) {
                yield lastSubject.pipe(operators_1.take(1)).toPromise();
            }
        });
    }
    makeLength(value, length, signed) {
        let returnValue = value;
        let negative = false;
        if (signed && returnValue.charAt(0) === '-') {
            negative = true;
            returnValue = returnValue.substr(1);
        }
        if (returnValue.length < length) {
            for (let i = 0; i < length - value.length; i++) {
                returnValue = '0' + returnValue;
            }
        }
        else if (returnValue.length > length) {
            returnValue = returnValue.substring(returnValue.length - length);
        }
        if (signed) {
            returnValue = negative ? '1' + returnValue : returnValue;
        }
        return returnValue;
    }
    export() {
        let binaryString = '';
        let tempBinaryString = '';
        Object.keys(this.values).forEach(k => {
            tempBinaryString += this.makeLength(this.values[Number(k)].ID.toString(2), 16);
            tempBinaryString += this.makeLength(this.values[Number(k)].type.toString(2), 8);
            switch (this.values[Number(k)].type) {
                case value_1.ValueType.analogInputPointer: {
                    tempBinaryString += this.makeLength(this.values[Number(k)].index.toString(2), 8);
                    break;
                }
                case value_1.ValueType.digitalInputPointer: {
                    tempBinaryString += this.makeLength(this.values[Number(k)].index.toString(2), 8);
                    break;
                }
                case value_1.ValueType.evaluation: {
                    tempBinaryString += this.makeLength(this.values[Number(k)].evaluationOperator.toString(2), 7);
                    tempBinaryString += this.values[Number(k)].isStatic ? '1' : '0';
                    tempBinaryString += this.makeLength(this.values[Number(k)].left.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.values[Number(k)].right.ID.toString(2), 16);
                    break;
                }
                case value_1.ValueType.list: {
                    tempBinaryString += this.makeLength(this.values[Number(k)].currentIndex.toString(2), 16);
                    tempBinaryString += this.makeLength(this.values[Number(k)].size.toString(2), 16);
                    this.values[Number(k)].values.forEach(v => {
                        tempBinaryString += this.makeLength(v.ID.toString(2), 16);
                    });
                    break;
                }
                case value_1.ValueType.number: {
                    tempBinaryString += this.makeLength(this.values[Number(k)].size.toString(2), 8);
                    const output = [];
                    fp.writeFloatBE(output, this.values[Number(k)].value);
                    output.forEach(v => {
                        tempBinaryString += this.makeLength(v.toString(2), 8);
                    });
                    break;
                }
                case value_1.ValueType.pixelIndex: {
                    tempBinaryString += this.makeLength(this.values[Number(k)].XCalc.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.values[Number(k)].YCalc.ID.toString(2), 16);
                    break;
                }
                case value_1.ValueType.systemPointer: {
                    tempBinaryString += this.makeLength(this.values[Number(k)].configType.toString(2), 8);
                    break;
                }
                case value_1.ValueType.text: {
                    tempBinaryString += this.makeLength(this.values[Number(k)].size.toString(2), 8);
                    this.values[Number(k)].value.forEach(v => {
                        tempBinaryString += this.makeLength(v.toString(2), 8);
                    });
                    break;
                }
            }
        });
        binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
        binaryString += tempBinaryString;
        tempBinaryString = '';
        Object.keys(this.instructions).forEach(k => {
            tempBinaryString += this.makeLength(this.instructions[Number(k)].ID.toString(2), 16);
            tempBinaryString += this.makeLength(this.instructions[Number(k)].instructionType.toString(2), 8);
            switch (this.instructions[Number(k)].instructionType) {
                case instruction_1.InstructionType.Clear: {
                    break;
                }
                case instruction_1.InstructionType.DrawCircle: {
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].radiusValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].xValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].yValue.ID.toString(2), 16);
                    break;
                }
                case instruction_1.InstructionType.FillCircle: {
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].radiusValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].xValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].yValue.ID.toString(2), 16);
                    break;
                }
                case instruction_1.InstructionType.DrawLine: {
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].x1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].y1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].x2Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].y2Value.ID.toString(2), 16);
                    break;
                }
                case instruction_1.InstructionType.DrawPixel: {
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].xValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].yValue.ID.toString(2), 16);
                    break;
                }
                case instruction_1.InstructionType.DrawRect: {
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].x1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].y1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].x2Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].y2Value.ID.toString(2), 16);
                    break;
                }
                case instruction_1.InstructionType.FillRect: {
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].x1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].y1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].x2Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].y2Value.ID.toString(2), 16);
                    break;
                }
                case instruction_1.InstructionType.DrawText: {
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].xValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].yValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].scaleValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].textValue.ID.toString(2), 16);
                    break;
                }
                case instruction_1.InstructionType.DrawTriangle: {
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].x1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].y1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].x2Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].y2Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].x3Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].y3Value.ID.toString(2), 16);
                    break;
                }
                case instruction_1.InstructionType.FillTriangle: {
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].x1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].y1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].x2Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].y2Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].x3Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].y3Value.ID.toString(2), 16);
                    break;
                }
                case instruction_1.InstructionType.MutateValue: {
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].leftValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].rightValue.ID.toString(2), 16);
                    break;
                }
                case instruction_1.InstructionType.RunCondition: {
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].evaluationValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].failSet.ID.toString(2), 16);
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].successSet.ID.toString(2), 16);
                    break;
                }
                case instruction_1.InstructionType.SetRotation: {
                    tempBinaryString += this.makeLength(this.instructions[Number(k)].rotationValue.ID.toString(2), 16);
                    break;
                }
            }
        });
        binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
        binaryString += tempBinaryString;
        tempBinaryString = '';
        const rootSet = this.instructionSets[this.rootInstructionSet];
        tempBinaryString += this.makeLength(rootSet.ID.toString(2), 16);
        tempBinaryString += this.makeLength(rootSet.size.toString(2), 16);
        rootSet.instructions.forEach(i => {
            tempBinaryString += this.makeLength(i.ID.toString(2), 16);
        });
        Object.keys(this.instructionSets).filter(k => !this.instructionSets[Number(k)].isRoot).forEach(k => {
            tempBinaryString += this.makeLength(this.instructionSets[Number(k)].ID.toString(2), 16);
            tempBinaryString += this.makeLength(this.instructionSets[Number(k)].size.toString(2), 16);
            this.instructionSets[Number(k)].instructions.forEach(i => {
                tempBinaryString += this.makeLength(i.ID.toString(2), 16);
            });
        });
        binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
        binaryString += tempBinaryString;
        const bytes = [];
        let index = 0;
        while (binaryString.length > 0) {
            bytes[index] = parseInt(binaryString.substring(0, 8), 2);
            binaryString = binaryString.substring(8);
            index++;
        }
        let returnString = '';
        bytes.forEach((byte, i) => {
            returnString += (i !== 0 ? ', ' : '') + byte;
        });
        return returnString;
    }
}
exports.Arcadable = Arcadable;
//# sourceMappingURL=arcadable.js.map