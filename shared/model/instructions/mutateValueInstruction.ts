import { Value, ValuePointer } from './../values/value';
import { Instruction, InstructionType } from './instruction';
import { Arcadable } from '../arcadable';

export class MutateValueInstruction extends Instruction {



    constructor(
        ID: number,
        public leftValue: ValuePointer<Value>,
        public rightValue: ValuePointer<Value>,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.MutateValue, name, game);
    }


    execute(): (() => Promise<any>)[] {

        return [async () => {
            const valueLeft = this.leftValue.getObject();
            const right = await this.rightValue.getValue();
            await valueLeft.set(right);
        }];
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            leftValue: this.leftValue,
            rightValue: this.rightValue,
        });
    }
}
