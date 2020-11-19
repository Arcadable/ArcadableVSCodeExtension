import { Arcadable } from '../arcadable';
import { Value, ValuePointer } from '../values/value';
import { Instruction, InstructionType } from './instruction';
import { InstructionSetPointer } from './instructionSet';

export class RunSetInstruction extends Instruction {


    constructor(
        ID: number,
        public set: InstructionSetPointer,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.RunSet, name, game);
    }


    execute(): (() => Promise<any>)[] {
        return this.set.execute();
    }

}
