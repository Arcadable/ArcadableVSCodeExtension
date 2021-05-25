import { Arcadable } from '../arcadable';
import { Executable } from '../callStack';
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
        game: Arcadable,
		public await: boolean,
    ) {
        super(ID, InstructionType.RunCondition, name, game, await);
    }


    async getExecutables(async: boolean): Promise<Executable[]> {

        return [new Executable(async () => {
            if (await this.evaluationValue.getObject().isTruthy()) {
                return this.successSet.getExecutables();
            } else if (this.failSet) {
                return this.failSet.getExecutables();
            }
            return [];
        }, async, false, [], null, null)];
        
    }

}
