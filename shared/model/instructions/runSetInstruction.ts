import { Arcadable } from '../arcadable';
import { Executable } from '../callStack';
import { Value, ValuePointer } from '../values/value';
import { Instruction, InstructionType } from './instruction';
import { InstructionSetPointer } from './instructionSet';

export class RunSetInstruction extends Instruction {


    constructor(
        ID: number,
        public set: InstructionSetPointer,
        name: string,
        game: Arcadable,
		public await: boolean,
    ) {
        super(ID, InstructionType.RunSet, name, game, await);
    }


    getExecutables(async: boolean): Executable[] {
        return [new Executable(async () => {
            return this.set.getExecutables();
        }, async, [], null)];
    }

}
