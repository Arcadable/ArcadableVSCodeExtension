import { Arcadable } from '../arcadable';
import { Value, ValuePointer } from './../values/value';
import { Instruction, InstructionType } from './instruction';
import { InstructionSetPointer } from './instructionSet';

export class RunConditionInstruction extends Instruction {

    private _EVALUATION_VALUE!: ValuePointer<Value>;
    set evaluationValue(value: ValuePointer<Value>) {
        this._EVALUATION_VALUE = value;
        this.called = true;
    }
    get evaluationValue(): ValuePointer<Value> {
        return this._EVALUATION_VALUE;
    }

    private _SUCCESS_SET!: InstructionSetPointer;
    set successSet(value: InstructionSetPointer) {
        this._SUCCESS_SET = value;
        this.called = true;
    }
    get successSet(): InstructionSetPointer {
        return this._SUCCESS_SET;
    }

    private _FAIL_SET!: InstructionSetPointer;
    set failSet(value: InstructionSetPointer) {
        this._FAIL_SET = value;
        this.called = true;
    }
    get failSet(): InstructionSetPointer {
        return this._FAIL_SET;
    }


    constructor(
        ID: number,
        instructionType: InstructionType,
        page: number,
        evaluationValue: ValuePointer<Value>,
        successSet: InstructionSetPointer,
        failSet: InstructionSetPointer,
        name: string,
        game: Arcadable
    ) {
        super(ID, instructionType, page, name, game);
        this.evaluationValue = evaluationValue;
        this.successSet = successSet;
        this.failSet = failSet;
    }


    execute(executionOrder: number[]): ((executionOrder: number[]) => any)[] {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        if (this.evaluationValue.getObject(executionOrder).isTruthy(executionOrder)) {
            return this.successSet.execute(executionOrder);
        } else if (this.failSet) {
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
