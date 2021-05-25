import { Executable } from './../callStack';
import { Value, ValuePointer } from './../values/value';
import { Instruction, InstructionType } from './instruction';
import { Arcadable } from '../arcadable';

export class MutateValueInstruction extends Instruction {



    constructor(
        ID: number,
        public leftValue: ValuePointer<Value>,
        public rightValue: ValuePointer<Value>,
        name: string,
        game: Arcadable,
		public await: boolean,
    ) {
        super(ID, InstructionType.MutateValue, name, game, await);
    }


    async getExecutables(async: boolean): Promise<Executable[]> {

        return [new Executable(async () => {
            const valueLeft = this.leftValue.getObject();
            const right = await this.rightValue.getValue();
            await valueLeft.set(right);
            return [];
        }, async, false, [], null, null)];
    }

}
