import { Executable } from './../callStack';
import { Arcadable } from '../arcadable';
import { LogicElement } from '../logicElement';
import { Instruction, InstructionPointer } from './instruction';

export class InstructionSet extends LogicElement {

    constructor(
        ID: number,
        public size: number,
        public instructions: InstructionPointer[],
        public async: boolean,
        name: string,
        game: Arcadable
    ) {
        super(ID, name, game);
    }

    getExecutables(): Executable[] {
        let awaitExecutable: Executable | null = null;
        return this.instructions.reduce(
            (acc: Executable[], instruction: InstructionPointer) => {
                if(!!awaitExecutable) {
                    awaitExecutable.awaiting.push(new Executable(async () => instruction.getExecutables(this.async), this.async, [], null));
                    return acc;
                } else {
                    const newExecutable = new Executable(async () => instruction.getExecutables(this.async), this.async, [], null);
                    if(instruction.await()) {
                        awaitExecutable = newExecutable;
                    }
                    return [...acc, newExecutable];
                }
            }, [] as Executable[]
        );
    }

}
export class InstructionSetPointer {
    ID!: number;
    game!: Arcadable;
    constructor(ID: number, game: Arcadable) {
    	this.ID = ID;
    	this.game = game;
    }
    getExecutables(): Executable[] {
        return this.game.instructionSets[this.ID].getExecutables();
    }
}
