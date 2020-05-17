import { Value, ValuePointer } from './../values/value';
import { Instruction, InstructionType } from './instruction';
import { Arcadable } from '../arcadable';

export class MutateValueInstruction extends Instruction {

    private _LEFT_VALUE!: ValuePointer<Value>;
    set leftValue(value: ValuePointer<Value>) {
        this._LEFT_VALUE = value;
        this.called = true;
    }
    get leftValue(): ValuePointer<Value> {
        return this._LEFT_VALUE;
    }

    private _RIGHT_VALUE!: ValuePointer<Value>;
    set rightValue(value: ValuePointer<Value>) {
        this._RIGHT_VALUE = value;
        this.called = true;
    }
    get rightValue(): ValuePointer<Value> {
        return this._RIGHT_VALUE;
    }


    constructor(
        ID: number,
        instructionType: InstructionType,
        page: number,
        leftValue: ValuePointer<Value>,
        rightValue: ValuePointer<Value>,
        name: string,
        game: Arcadable
    ) {
        super(ID, instructionType, page, name, game);
        this.leftValue = leftValue;
        this.rightValue = rightValue;

    }


    execute(executionOrder: number[]): ((executionOrder: number[]) => any)[] {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        const valueLeft = this.leftValue.getObject(executionOrder);
        const right = this.rightValue.getValue(executionOrder);
        return [(e: number[]) => { valueLeft.set(right, e); }];
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
