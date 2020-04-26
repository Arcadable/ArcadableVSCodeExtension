import { RunConditionInstruction } from './instructions/runConditionInstruction';
import { MutateValueInstruction } from './instructions/mutateValueInstruction';
import { FillTriangleInstruction } from './instructions/fillTriangleInstruction';
import { DrawTriangleInstruction } from './instructions/drawTriangleInstruction';
import { DrawTextInstruction } from './instructions/drawTextInstruction';
import { FillRectInstruction } from './instructions/fillRectInstruction';
import { DrawRectInstruction } from './instructions/drawRectInstruction';
import { DrawPixelInstruction } from './instructions/drawPixelInstruction';
import { DrawLineInstruction } from './instructions/drawLineInstruction';
import { FillCircleInstruction } from './instructions/fillCircleInstruction';
import { DrawCircleInstruction } from './instructions/drawCircleInstruction';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { Instruction, InstructionType } from './instructions/instruction';
import { InstructionSet } from './instructions/instructionSet';
import { SystemConfig } from './systemConfig';
import { EvaluationValue } from './values/evaluationValue';
import { Value, ValueType } from './values/value';
import { AnalogInputValue } from './values/analogInputValue';
import { DigitalInputValue } from './values/digitalInputValue';
import { ListValue } from './values/listValue';
import { NumberValue } from './values/numberValue';
import { PixelValue } from './values/pixelValue';
import { SystemConfigValue } from './values/systemConfigValue';
import { TextValue } from './values/textValue';
import { SetRotationInstruction } from './instructions/setRotationInstruction';
const fp = require('ieee-float');


export class Arcadable {

    resetCalled = new Subject<boolean>();
    breakEncountered = new Subject<boolean>();
    drawInstruction = new Subject<any>();
    values: {[key: number]: Value} = {};
    instructions: {[key: number]: Instruction} = {};
    instructionSets: {[key: number]: InstructionSet} = {};
    rootInstructionSet: number = 0;
    systemConfig: SystemConfig;

    prevMillis = 0;
    startMillis = 0;

    running = false;
    wait = false;
    waitSubjects: Subject<void>[] = [];
    constructor(
        systemConfig: SystemConfig
    ) {
        this.systemConfig = systemConfig;
        this.startMillis = new Date().getTime();
    }

    setGameLogic(
        values: {[key: number]: Value},
        instructions: {[key: number]: Instruction},
        instructionSets: {[key: number]: InstructionSet},
        rootInstructionSet: number
    ) {
        this.values = values;
        this.instructions = instructions;
        this.instructionSets = instructionSets;
        this.rootInstructionSet = rootInstructionSet;
    }

    async start() {

        Object.keys(this.values).forEach(k => {
            if ((this.values[Number(k)] as Value).type === ValueType.evaluation) {
                (this.values[Number(k)] as EvaluationValue)._STATIC_RESULT = undefined;
            }
        });

        this.running = true;
        while (this.running) {
            this.waitSubjects.forEach(s => s.next());
            await this.step();
        }
    }

    stop() {
        this.running = false;
    }

    async step() {
        this.resetCalled.next();
        this.waitSubjects = [];
        const currentMillis = new Date().getTime();
        if (currentMillis - this.prevMillis < this.systemConfig.minMillisPerFrame) {
            await new Promise( resolve =>
                setTimeout(
                    resolve,
                    this.systemConfig.minMillisPerFrame - (new Date().getTime() - this.prevMillis)
                )
            );
        }
        this.doGameStep();
        this.prevMillis = new Date().getTime();

    }

    private async doGameStep() {
        this.systemConfig.fetchInputValues();
        const lastSubject = new Subject<void>();
        const rootInstructionSet = this.instructionSets[
            this.rootInstructionSet
        ] as InstructionSet;

        rootInstructionSet.instructions.forEach(async (instructionPointer, i) => {
            if (this.wait) {
                const waitFor = new Subject<void>();
                this.waitSubjects.push(waitFor);
                await waitFor.pipe(take(1)).toPromise();
            }
            await this.execute((executionOrder: number[]) => instructionPointer.execute(executionOrder), [i]);
            if (i + 1 === rootInstructionSet.size) {
                lastSubject.next();
            }
        });
        if ( this.wait && rootInstructionSet.size > 0) {
            await lastSubject.pipe(take(1)).toPromise();
        }
    }

    async execute(action: (executionOrder: number[]) => any, executionOrder: number[]) {
        if (executionOrder.length % 300 === 0) {
            const lastSubject = new Subject<void>();
            setTimeout(() => {
                this.doExecute(action, executionOrder);
                lastSubject.next();
            }, 0);
            await lastSubject.pipe(take(1)).toPromise();
        } else {
            this.doExecute(action, executionOrder);
        }
    }

    async doExecute(action: (executionOrder: number[]) => any, executionOrder: number[]) {
        const lastSubject = new Subject<void>();

        const actions = action(executionOrder) || [];
        (this.wait ? actions.reverse() : actions).forEach(async (a: (executionOrder: number[]) => any, i: number) => {
            if (this.wait) {
                const waitFor = new Subject<void>();
                this.waitSubjects.unshift(waitFor);
                await waitFor.pipe(take(1)).toPromise();
            }

            await this.execute(a, [...executionOrder, i]);
            if (i + 1 === actions.length) {
                lastSubject.next();
            }
        });
        if (this.wait && actions.length > 0) {
            await lastSubject.pipe(take(1)).toPromise();
        }
    }

    makeLength(value: string, length: number, signed?: boolean) {
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
        } else if (returnValue.length > length) {
            returnValue = returnValue.substring(returnValue.length - length);
        }
        if (signed) {
            returnValue = negative ? '1' + returnValue : returnValue;
        }
        return returnValue;
    }

    export(): string {
        let binaryString = '';

        let tempBinaryString = '';
        Object.keys(this.values).forEach(k => {
            tempBinaryString += this.makeLength(this.values[Number(k)].ID.toString(2), 16);
            tempBinaryString += this.makeLength(this.values[Number(k)].type.toString(2), 8);

            switch (this.values[Number(k)].type) {
                case ValueType.analogInputPointer: {
                    tempBinaryString += this.makeLength((this.values[Number(k)] as AnalogInputValue).index.toString(2), 8);
                    break;
                }
                case ValueType.digitalInputPointer: {
                    tempBinaryString += this.makeLength((this.values[Number(k)] as DigitalInputValue).index.toString(2), 8);
                    break;
                }
                case ValueType.evaluation: {
                    tempBinaryString += this.makeLength((this.values[Number(k)] as EvaluationValue).evaluationOperator.toString(2), 7);
                    tempBinaryString += (this.values[Number(k)] as EvaluationValue).isStatic ? '1' : '0';
                    tempBinaryString += this.makeLength((this.values[Number(k)] as EvaluationValue).left.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.values[Number(k)] as EvaluationValue).right.ID.toString(2), 16);
                    break;
                }
                case ValueType.list: {
                    tempBinaryString += this.makeLength((this.values[Number(k)] as ListValue<any>).currentIndex.toString(2), 16);
                    tempBinaryString += this.makeLength((this.values[Number(k)] as ListValue<any>).size.toString(2), 16);
                    (this.values[Number(k)] as ListValue<any>).values.forEach(v => {
                        tempBinaryString += this.makeLength(v.ID.toString(2), 16);
                    });
                    break;
                }
                case ValueType.number: {
                    tempBinaryString += this.makeLength((this.values[Number(k)] as NumberValue).size.toString(2), 8);
                    const output: number[] = [];
                    fp.writeFloatBE(output, (this.values[Number(k)] as NumberValue).value);
                    output.forEach(v => {
                        tempBinaryString += this.makeLength(v.toString(2), 8);
                    });
                    break;
                }
                case ValueType.pixelIndex: {
                    tempBinaryString += this.makeLength((this.values[Number(k)] as PixelValue).XCalc.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.values[Number(k)] as PixelValue).YCalc.ID.toString(2), 16);
                    break;
                }
                case ValueType.systemPointer: {
                    tempBinaryString += this.makeLength((this.values[Number(k)] as SystemConfigValue).configType.toString(2), 8);
                    break;
                }
                case ValueType.text: {
                    tempBinaryString += this.makeLength((this.values[Number(k)] as TextValue).size.toString(2), 8);
                    (this.values[Number(k)] as TextValue).value.forEach(v => {
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
                case InstructionType.Clear: {
                    break;
                }
                case InstructionType.DrawCircle: {
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawCircleInstruction).colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawCircleInstruction).radiusValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawCircleInstruction).xValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawCircleInstruction).yValue.ID.toString(2), 16);
                    break;
                }
                case InstructionType.FillCircle: {
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillCircleInstruction).colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillCircleInstruction).radiusValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillCircleInstruction).xValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillCircleInstruction).yValue.ID.toString(2), 16);
                    break;
                }
                case InstructionType.DrawLine: {
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawLineInstruction).colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawLineInstruction).x1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawLineInstruction).y1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawLineInstruction).x2Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawLineInstruction).y2Value.ID.toString(2), 16);
                    break;
                }
                case InstructionType.DrawPixel: {
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawPixelInstruction).colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawPixelInstruction).xValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawPixelInstruction).yValue.ID.toString(2), 16);
                    break;
                }
                case InstructionType.DrawRect: {
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawRectInstruction).colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawRectInstruction).x1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawRectInstruction).y1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawRectInstruction).x2Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawRectInstruction).y2Value.ID.toString(2), 16);
                    break;
                }
                case InstructionType.FillRect: {
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillRectInstruction).colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillRectInstruction).x1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillRectInstruction).y1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillRectInstruction).x2Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillRectInstruction).y2Value.ID.toString(2), 16);
                    break;
                }
                case InstructionType.DrawText: {
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTextInstruction).colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTextInstruction).xValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTextInstruction).yValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTextInstruction).scaleValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTextInstruction).textValue.ID.toString(2), 16);
                    break;
                }
                case InstructionType.DrawTriangle: {
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTriangleInstruction).colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTriangleInstruction).x1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTriangleInstruction).y1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTriangleInstruction).x2Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTriangleInstruction).y2Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTriangleInstruction).x3Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTriangleInstruction).y3Value.ID.toString(2), 16);
                    break;
                }
                case InstructionType.FillTriangle: {
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillTriangleInstruction).colorValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillTriangleInstruction).x1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillTriangleInstruction).y1Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillTriangleInstruction).x2Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillTriangleInstruction).y2Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillTriangleInstruction).x3Value.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillTriangleInstruction).y3Value.ID.toString(2), 16);
                    break;
                }
                case InstructionType.MutateValue: {
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as MutateValueInstruction).leftValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as MutateValueInstruction).rightValue.ID.toString(2), 16);
                    break;
                }
                case InstructionType.RunCondition: {
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as RunConditionInstruction).evaluationValue.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as RunConditionInstruction).failSet.ID.toString(2), 16);
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as RunConditionInstruction).successSet.ID.toString(2), 16);
                    break;
                }
                case InstructionType.SetRotation: {
                    tempBinaryString += this.makeLength((this.instructions[Number(k)] as SetRotationInstruction).rotationValue.ID.toString(2), 16);
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
