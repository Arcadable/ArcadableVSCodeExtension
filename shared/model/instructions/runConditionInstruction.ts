import { Arcadable } from '../arcadable';
import { Value, ValuePointer } from './../values/value';
import { Instruction, InstructionType } from './instruction';
import { InstructionSetPointer } from './instructionSet';

export class RunConditionInstruction extends Instruction {


    constructor(
        ID: number,
        public evaluationValue: ValuePointer<Value>,
        public successSet: InstructionSetPointer,
        public failSet: InstructionSetPointer,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.RunCondition, name, game);
    }


    execute(): (() => Promise<any>)[] {

        return [async () => {
            if (await this.evaluationValue.getObject().isTruthy()) {
                return this.successSet.execute();
            } else if (this.failSet) {
                return this.failSet.execute();
            }
            return [];
        }];
        
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            evaluationValue: this.evaluationValue,
            successSet: this.successSet,
            failSet: this.failSet
        });
    }
}
